---
name: mirra-document
description: "Use Mirra to document upload, processing, and management with multi-graph sharing. Covers all Documents SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Documents

Document upload, processing, and management with multi-graph sharing

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

## API Call Pattern

All operations use a single POST endpoint with the resource ID and method in the body:

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "resourceId": "document",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/document/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `upload` | Upload and process a document (PDF, DOCX, TXT, MD). Returns normalized flat structure. |
| `get` | Get a single document by its documentId, including the full document text. The complete text is i... |
| `getStatus` | Get document processing status. Returns normalized flat structure. |
| `getChunks` | Get all chunks for a document, in order. Returns normalized flat chunk structures. For the docume... |
| `delete` | Delete a document and all its chunks. Returns normalized flat structure. |
| `share` | Share a document to another graph (group or user-contact). Returns normalized flat structure. |
| `unshare` | Remove document access from a graph. Returns normalized flat structure. |
| `listGraphs` | List all graphs a document is shared in. Returns normalized flat graph structures. |
| `search` | Semantic (meaning-based) search across document chunks in a graph. Takes a natural-language `quer... |
| `list` | List documents in a graph (metadata only — does not include document text). Returns normalized fl... |

## Operation Details

### `upload`

Upload and process a document (PDF, DOCX, TXT, MD). Returns normalized flat structure.

**Arguments:**

- `file` (string, **required**): Base64 encoded file content
- `filename` (string, **required**): Original filename with extension
- `mimeType` (string, **required**): MIME type (application/pdf, text/plain, etc.)
- `graphId` (string, *optional*): Target graph ID (defaults to user's personal graph)
- `title` (string, *optional*): Custom document title
- `productTags` (array, *optional*): Array of product tags for categorization

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: documentId, chunkCount, graphIds[], primaryGraphId, processingTimeMs. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"upload","params":{"file":"<value>","filename":"<value>","mimeType":"<value>"}}' | jq .
```

### `get`

Get a single document by its documentId, including the full document text. The complete text is in the `extractedText` field — read or summarize a document directly from it (no need to fetch or stitch chunks). Also returns metadata (title, filename, mimeType, fileSize, processingStatus, etc.) and the document's `chunks[]`. To find content across many documents by meaning, use `search`; to enumerate documents in a graph, use `list`.

**Arguments:**

- `documentId` (string, **required**): Document ID to retrieve (e.g. "document:..."). The parameter is named documentId, not id.

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: documentId, title, filename, mimeType, fileSize, processingStatus, chunkCount, graphIds[], primaryGraphId, createdAt, createdByUserId, hasMultipleGraphs, extractedText (full document text — use this to read the document), chunks[]. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"get","params":{"documentId":"<ID>"}}' | jq .
```

### `getStatus`

Get document processing status. Returns normalized flat structure.

**Arguments:**

- `documentId` (string, **required**): Document ID to check

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: documentId, processingStatus, processingError, chunkCount, extractedAt, processingCompletedAt. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"getStatus","params":{"documentId":"<ID>"}}' | jq .
```

### `getChunks`

Get all chunks for a document, in order. Returns normalized flat chunk structures. For the document's full text in one field, prefer `get` (it returns `extractedText`); use getChunks only when you need the per-chunk breakdown or chunk positions.

**Arguments:**

- `documentId` (string, **required**): Document ID

**Returns:**

`AdapterOperationResult`: Returns { documentId, count, chunks[] }. Each chunk has FLAT fields: chunkId, documentId, content, position. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"getChunks","params":{"documentId":"<ID>"}}' | jq .
```

### `delete`

Delete a document and all its chunks. Returns normalized flat structure.

**Arguments:**

- `documentId` (string, **required**): Document ID to delete

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: documentId, deleted, chunksDeleted. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"delete","params":{"documentId":"<ID>"}}' | jq .
```

### `share`

Share a document to another graph (group or user-contact). Returns normalized flat structure.

**Arguments:**

- `documentId` (string, **required**): Document ID to share
- `targetGraphId` (string, **required**): Target graph ID to share to
- `shareReason` (string, *optional*): Optional reason for sharing

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: documentId, graphIds[], sharedToGraphId, sharedByUserId, sharedAt. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"share","params":{"documentId":"<ID>","targetGraphId":"<ID>"}}' | jq .
```

### `unshare`

Remove document access from a graph. Returns normalized flat structure.

**Arguments:**

- `documentId` (string, **required**): Document ID
- `graphId` (string, **required**): Graph ID to remove access from

**Returns:**

`AdapterOperationResult`: Returns FLAT structure with: documentId, graphIds[], removedGraphId. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"unshare","params":{"documentId":"<ID>","graphId":"<ID>"}}' | jq .
```

### `listGraphs`

List all graphs a document is shared in. Returns normalized flat graph structures.

**Arguments:**

- `documentId` (string, **required**): Document ID

**Returns:**

`AdapterOperationResult`: Returns { documentId, count, graphs[] }. Each graph has FLAT fields: graphId, isPrimary, sharedAt, sharedByUserId, shareReason. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"listGraphs","params":{"documentId":"<ID>"}}' | jq .
```

### `search`

Semantic (meaning-based) search across document chunks in a graph. Takes a natural-language `query` (not a documentId) and returns the best-matching passages in `results[]`, each with content, score, documentId, and position. Use this to find relevant content across documents; to read one specific document in full, use `get` instead.

**Arguments:**

- `query` (string, **required**): Natural-language search query (what you are looking for). This is NOT a documentId.
- `graphId` (string, *optional*): Graph ID to search in (defaults to user's graph)
- `limit` (number, *optional*): Maximum results (default: 10)
- `threshold` (number, *optional*): Similarity threshold 0-1 (default: 0.7)

**Returns:**

`AdapterOperationResult`: Returns { graphId, count, results[] }. Each result has FLAT fields: chunkId, documentId, content, score, position. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"search","params":{"query":"search term"}}' | jq .
```

### `list`

List documents in a graph (metadata only — does not include document text). Returns normalized flat document structures. To read a document's content, call `get` with its documentId; to search content by meaning, use `search`.

**Arguments:**

- `graphId` (string, *optional*): Graph ID to list documents from (defaults to user's graph)
- `limit` (number, *optional*): Maximum results (default: 50)
- `offset` (number, *optional*): Pagination offset (default: 0)

**Returns:**

`AdapterOperationResult`: Returns { graphId, count, documents[] }. Each document has FLAT fields: documentId, title, filename, mimeType, fileSize, processingStatus, chunkCount, graphIds[], createdAt, createdByUserId. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"document","method":"list","params":{}}' | jq .
```

## Response Format

All SDK responses return the operation payload wrapped in a standard envelope:

```json
{
  "success": true,
  "data": { ... }
}
```

The `data` field contains the operation result. Error responses include:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

## Tips

- Use `jq .` to pretty-print responses, `jq .data` to extract just the payload
- For list operations, results are in `data.results` or directly in `data` (check examples)
- Pass `--fail-with-body` to curl to see error details on HTTP failures
- Store the API key in a variable: `export API_KEY="your-key"`
