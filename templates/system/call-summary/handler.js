/**
 * Call Summary Lambda Script
 * 
 * System script that generates comprehensive summaries for completed voice calls.
 * This is invoked automatically by the system flow when a call ends.
 * 
 * ARCHITECTURE NOTE: This script is executed once PER PARTICIPANT after a call ends.
 * When a call completes, the system emits one call.ended event for each participant.
 * Each participant's "Call Summary Generator" flow triggers independently, allowing
 * users to customize their own summary preferences and receive personalized summaries.
 * 
 * FEED ITEM VISIBILITY:
 * - By default, each user's summary is PRIVATE (only they can see it)
 * - Users can customize their flow via script input to share summaries with others
 * - Example: Team leads can configure targetUserIds to share with their team
 * - The script has access to event.call.participants for advanced sharing logic
 * 
 * This design ensures users control their own experience - a core Mirra principle.
 * 
 * The script:
 * 1. Checks if the call has sufficient content to warrant a summary
 * 2. Generates a comprehensive summary using AI
 * 3. Creates a private feed item linked to the voice call (visible only to the user)
 */

/**
 * Clean up summary text by removing empty sections
 */
function cleanupSummaryText(summaryText) {
  if (!summaryText || summaryText.trim().length === 0) {
    return '';
  }

  // Remove common meta-commentary phrases
  let cleaned = summaryText
    .replace(/^(Of course!|Here is the call summary|I'll|I've created|Let me)/i, '')
    .replace(/\*\*Note:\*\*.*$/gm, '')
    .trim();

  // Split into sections and filter out empty ones
  const sections = cleaned.split(/(?=##\s*\d+\.)/);
  const nonEmptySections = sections.filter(section => {
    if (!section.trim()) return false;
    
    const content = section.replace(/##\s*\d+\.\s*[^\n]*\n/g, '').trim();
    
    if (!content || 
        content.length < 10 || 
        /^\[.*\]$/.test(content) || 
        /^(None|No |Nothing|Not applicable)/i.test(content)) {
      return false;
    }
    
    return true;
  });

  return nonEmptySections.join('\n\n').trim();
}

/**
 * Main handler function
 * NOTE: This function is executed once PER PARTICIPANT after a call ends.
 * Each participant receives their own user-scoped event and generates their own private summary.
 * 
 * @param {Object} event - The call.ended event data
 * @param {Object} context - Lambda execution context
 * @param {Object} mirra - Mirra SDK instance
 */
export async function handler(event, context, mirra) {
  const { call, userId } = event;
  
  console.log('Call summary script invoked for user', {
    userId,
    agoraCallId: call.agoraCallId,
    chatInstanceId: call.chatInstanceId,
    participantCount: call.participants?.length || 0
  });

  try {
    // Step 1: Check if transcript exists
    const transcript = call.transcript || '';
    
    if (!transcript || transcript.trim().length === 0) {
      console.log('No transcript available for call, skipping summary', {
        agoraCallId: call.agoraCallId
      });
      return { 
        success: false, 
        reason: 'No transcript available' 
      };
    }

    // Step 2: Build participant context
    const participantContext = call.participants
      .map(p => `${p.userId}: ${p.username}`)
      .join('\n');

    console.log('Checking call content sufficiency', {
      agoraCallId: call.agoraCallId,
      transcriptLength: transcript.length,
      participantCount: call.participants.length
    });

    // Step 3: Check if transcript has sufficient content
    const sufficiencyCheckPrompt = `You are analyzing a call transcript to determine if there is sufficient meaningful content to generate a comprehensive summary.

**CALL PARTICIPANTS:**
${participantContext}

**INSTRUCTIONS:**
Analyze the transcript and respond with ONLY a JSON object containing:
{
  "hasSufficientContent": true/false,
  "reason": "Brief explanation of why content is sufficient or insufficient"
}

**CRITERIA FOR SUFFICIENT CONTENT:**
- Substantial conversation beyond greetings/small talk (at least 2-3 minutes of meaningful discussion)
- Clear topics, decisions, commitments, or action items discussed
- More than just technical issues, connection problems, or brief check-ins

**CRITERIA FOR INSUFFICIENT CONTENT:**
- Only greetings, hellos, goodbyes, or brief pleasantries
- Primarily technical difficulties or connection issues
- Very short calls with no substantial discussion
- Just testing or accidental calls

**TRANSCRIPT:**
${transcript}`;

    const sufficiencyResult = await mirra.ai.chat({
      messages: [{ role: 'user', content: sufficiencyCheckPrompt }],
      provider: 'anthropic',
      model: 'claude-haiku-4-5'
    });

    let sufficiencyData;
    try {
      const cleanResponse = sufficiencyResult.content.replace(/```json\n?|\n?```/g, '').trim();
      sufficiencyData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.warn('Failed to parse sufficiency check response, assuming sufficient content', {
        response: sufficiencyResult.content,
        parseError: parseError.message
      });
      sufficiencyData = { hasSufficientContent: true, reason: "Parse error - defaulting to sufficient" };
    }

    console.log('Content sufficiency check completed', {
      agoraCallId: call.agoraCallId,
      hasSufficientContent: sufficiencyData.hasSufficientContent,
      reason: sufficiencyData.reason
    });

    // Step 4: Early abort if insufficient content
    if (!sufficiencyData.hasSufficientContent) {
      console.log('Skipping call summary generation - insufficient content', {
        agoraCallId: call.agoraCallId,
        reason: sufficiencyData.reason
      });
      return { 
        success: false, 
        reason: sufficiencyData.reason 
      };
    }

    // Step 5: Generate comprehensive summary
    const summaryPrompt = `You are analyzing a call transcript to generate a comprehensive summary.

**CALL PARTICIPANTS:**
${participantContext}

**INSTRUCTIONS:**
1. Generate a comprehensive call summary with the standard sections BASED ONLY ON THE ACTUAL CALL CONTENT
2. Identify specific commitments, action items, and responsibilities mentioned by participants
3. Use actionable task titles with verb + object format (e.g., "Call dentist", "Review proposal", "Send follow-up email")

**CRITICAL: Your response should contain ONLY the summary sections below. Do not include any meta-commentary, acknowledgments, or explanations about the process.**

**REQUIRED OUTPUT FORMAT - Include only sections that have actual content:**

**Call Overview**
[Main topics discussed and overall purpose - only include if there was substantial discussion - do not include heading]

**Key Decisions Made**
[Specific decisions with who was involved - only include if decisions were actually made]

**Action Items & Tasks**
[List commitments identified - only include if specific commitments were made]

**Important Follow-up Items**
[Unresolved items and scheduled follow-ups - only include if follow-ups were discussed]

**IMPORTANT RULES:**
- OMIT any section that doesn't have meaningful content from the actual call
- Focus on what was actually discussed, not what could have been discussed
- Use a supportive, family-friendly tone
- Keep it concise but comprehensive (≤500 words total)
- Do not include any introductory text, just start with the first section that has content
- Do not add the participants or duration to the summary

**TRANSCRIPT:**
${transcript}`;

    console.log('Generating call summary with AI', {
      agoraCallId: call.agoraCallId,
      promptLength: summaryPrompt.length
    });

    const summaryResult = await mirra.ai.chat({
      messages: [{ role: 'user', content: summaryPrompt }],
      provider: 'anthropic',
      model: 'claude-haiku-4-5'
    });

    let summaryText = summaryResult.content;
    summaryText = cleanupSummaryText(summaryText);

    // Step 6: Format the complete summary with metadata
    const participantNames = call.participants
      .map(p => p.username)
      .filter(name => name && name !== 'Unknown')
      .join(', ');
    
    const durationMinutes = Math.round(call.durationSeconds / 60);

    console.log('Call summary generated successfully', {
      agoraCallId: call.agoraCallId,
      summaryLength: summaryText.length
    });

    // Step 7: Create feed item via SDK
    // Build content blocks for the feed item
    const blocks = [];

    // Add participant and duration info
    if (participantNames) {
      blocks.push({
        type: 'key_value',
        pairs: [
          { key: 'Participants', value: participantNames, icon: 'people-outline' },
          { key: 'Duration', value: `${durationMinutes} minutes`, icon: 'time-outline' }
        ],
        layout: 'horizontal'
      });
    }

    // Add divider
    if (blocks.length > 0) {
      blocks.push({ type: 'divider' });
    }

    // Add summary text
    if (summaryText && summaryText.trim().length > 0) {
      blocks.push({
        type: 'text',
        content: summaryText,
        style: 'body'
      });
    } else {
      blocks.push({
        type: 'text',
        content: 'Call completed - no significant topics or decisions were discussed.',
        style: 'body',
        color: 'muted'
      });
    }

    const feedItemResult = await mirra.resources.call({
      resourceId: 'feed-items',
      method: 'create_feed_item',
      parameters: {
        title: 'Call Summary',
        itemType: 'informative',
        blocks: blocks,
        avatar: {
          type: 'icon',
          value: 'call-outline'
        },
        metadata: {
          voiceCallId: call.agoraCallId,
          chatInstanceId: call.chatInstanceId,
          durationSeconds: call.durationSeconds
        }
      }
    });

    console.log('Feed item created for call summary', {
      agoraCallId: call.agoraCallId,
      feedItemId: feedItemResult.data?.feedItemId
    });

    // Return structured output for FLOW_COMPLETE event
    return {
      success: true,
      callId: call.agoraCallId,
      chatInstanceId: call.chatInstanceId,
      feedItemId: feedItemResult.data?.feedItemId || '',
      summaryText: summaryText,
      participants: call.participants.map(p => p.userId),
      durationSeconds: call.durationSeconds
    };

  } catch (error) {
    console.error('Error in call summary script', {
      agoraCallId: call.agoraCallId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

