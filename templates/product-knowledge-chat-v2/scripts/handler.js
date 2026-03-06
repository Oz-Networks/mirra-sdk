/**
 * Product Knowledge Chat Flow Handler
 * Version: 1.0.0
 *
 * Handles customer chat messages for the product-knowledge-chat-v2 template.
 * This flow receives a customer question, performs RAG search against product
 * documentation, generates an AI response, and logs the conversation as a
 * memory for the template owner to review.
 *
 * Input (via event.data):
 *   - question: string - The customer's question
 *   - productId: string - The selected product ID
 *   - productName: string - The selected product name
 *   - conversationHistory: Array<{role, content}> - Recent conversation context
 *   - showSources: boolean - Whether to return source documents
 *
 * Output:
 *   - response: string - The AI-generated answer
 *   - sources: Array<{documentId, content, score}> - Source documents (if requested)
 */

export async function handler(event, context, mirra) {
  const {
    question,
    productId,
    productName,
    conversationHistory = [],
    showSources = true,
  } = event.data || {};

  if (!question || !productId) {
    return {
      success: false,
      response: 'Missing required fields: question and productId.',
      sources: [],
    };
  }

  console.log('Product knowledge chat invoked', {
    productId,
    productName,
    questionLength: question.length,
    historyLength: conversationHistory.length,
  });

  try {
    // Step 1: Find documents linked to this product
    const linksResult = await mirra.memory.query({
      type: 'document_product_link',
      limit: 100,
    });

    const linkItems = Array.isArray(linksResult)
      ? linksResult
      : linksResult?.data?.entities || linksResult?.entities || [];

    const productDocIds = linkItems
      .filter((link) => link.metadata?.productId === productId)
      .map((link) => link.metadata?.documentId)
      .filter(Boolean);

    // Step 2: Search for relevant document chunks
    let sources = [];
    if (productDocIds.length > 0) {
      const searchResult = await mirra.documents.search({
        query: question,
        limit: 10,
        threshold: 0.5,
      });

      const relevantResults = (searchResult.results || [])
        .filter((r) => productDocIds.includes(r.documentId))
        .slice(0, 5);

      sources = relevantResults.map((r) => ({
        documentId: r.documentId,
        content: r.content,
        score: r.score,
      }));
    }

    console.log('RAG search completed', {
      productId,
      linkedDocCount: productDocIds.length,
      sourcesFound: sources.length,
    });

    // Step 3: Build context and generate AI response
    let documentContext = '';
    if (sources.length > 0) {
      documentContext = sources
        .map((s, i) => `[Source ${i + 1}]\n${s.content}`)
        .join('\n\n---\n\n');
    }

    const systemPrompt = sources.length > 0
      ? `You are a helpful product support assistant for ${productName}. Answer the customer's question based on the provided documentation. Be accurate, concise, and helpful. If the documentation doesn't fully cover the question, say so and suggest contacting support.\n\nRelevant documentation:\n${documentContext}`
      : `You are a helpful product support assistant for ${productName}. The customer asked a question but no specific documentation was found. Provide a helpful general response and suggest the customer contact support for more detailed help.`;

    const messages = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (already limited to last 6 by the client)
    for (const msg of conversationHistory) {
      messages.push({ role: msg.role, content: msg.content });
    }

    // Add current question
    messages.push({ role: 'user', content: question });

    const aiResult = await mirra.ai.chat({
      messages,
      model: 'claude-haiku-4-5',
      temperature: 0.3,
      maxTokens: 1500,
    });

    const response = aiResult?.content || '';

    console.log('AI response generated', {
      productId,
      responseLength: response.length,
    });

    // Step 4: Log conversation as a memory for the owner to review
    await mirra.memory.create({
      content: `Customer question about ${productName}:\n\nQ: ${question}\n\nA: ${response}`,
      type: 'note',
      metadata: {
        title: `Customer Chat - ${productName}`,
        tag: 'customer-conversation',
        source: 'product-knowledge-chat',
        productId,
        productName,
        questionPreview: question.substring(0, 200),
        sourcesUsed: sources.length,
      },
    });

    console.log('Conversation logged to memory', { productId, productName });

    return {
      success: true,
      response,
      sources: showSources ? sources : [],
    };
  } catch (error) {
    console.error('Error in product knowledge chat handler', {
      productId,
      error: error.message,
      stack: error.stack,
    });

    return {
      success: false,
      response: 'Sorry, I encountered an error processing your question. Please try again.',
      sources: [],
    };
  }
}
