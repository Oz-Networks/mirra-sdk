---
name: mirra-google-docs
description: "Use Mirra to google docs document creation and editing. Covers all Google Docs SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Google Docs

Google Docs document creation and editing

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Google Docs requires OAuth authentication. The user must have connected their Google Docs account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createDocument` | Create a new Google Doc |
| `getDocument` | Get a Google Doc by ID. Returns normalized flat structure with extracted fields. |
| `appendText` | Append text to the end of a document |
| `replaceText` | Replace text in a document |
| `getDocumentContent` | Get the text content of a Google Doc |
| `insertTextAtPosition` | Insert text at a specific position in the document |
| `insertTextAfter` | Insert text after a search string in the document |
| `insertHeading` | Insert a heading into the document |
| `insertList` | Insert a bulleted or numbered list into the document |
| `insertTable` | Insert a table into the document |
| `updateDocumentContent` | Replace the entire content of a document |
| `createSection` | Create a new section with a heading and content. Returns normalized result with insertion details. |
| `findInsertionPoint` | Find the character position for insertion based on position or search text. Returns normalized re... |

## Operation Details

### `createDocument`

Create a new Google Doc

**Arguments:**

- `title` (string, **required**): Title of the document

**Returns:**

`AdapterOperationResult`: Created document with documentId and title

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/createDocument" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"title":"My New Document"}' | jq .
```

**Example response:**

```json
{
  "documentId": "1abc123XYZ",
  "title": "My New Document"
}
```

### `getDocument`

Get a Google Doc by ID. Returns normalized flat structure with extracted fields.

**Arguments:**

- `documentId` (string, **required**): ID of the document

**Returns:**

`AdapterOperationResult`: Normalized document with documentId, title, body, url, hasContent fields

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/getDocument" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"1abc123XYZ"}' | jq .
```

**Example response:**

```json
{
  "documentId": "1abc123XYZ",
  "title": "My Document",
  "revisionId": "rev_123",
  "body": "Document text content here...",
  "bodyLength": 28,
  "url": "https://docs.google.com/document/d/1abc123XYZ/edit",
  "hasContent": true
}
```

### `appendText`

Append text to the end of a document

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `text` (string, **required**): Text to append

**Returns:**

`AdapterOperationResult`: Append operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/appendText" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>","text":"<value>"}' | jq .
```

### `replaceText`

Replace text in a document

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `searchText` (string, **required**): Text to search for
- `replaceText` (string, **required**): Text to replace with

**Returns:**

`AdapterOperationResult`: Replace operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/replaceText" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>","searchText":"<value>","replaceText":"<value>"}' | jq .
```

### `getDocumentContent`

Get the text content of a Google Doc

**Arguments:**

- `documentId` (string, **required**): ID of the document

**Returns:**

`AdapterOperationResult`: Document text content

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/getDocumentContent" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>"}' | jq .
```

### `insertTextAtPosition`

Insert text at a specific position in the document

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `text` (string, **required**): Text to insert
- `position` (number, **required**): Character position to insert at (1-indexed)

**Returns:**

`AdapterOperationResult`: Insert operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/insertTextAtPosition" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>","text":"<value>","position":10}' | jq .
```

### `insertTextAfter`

Insert text after a search string in the document

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `searchText` (string, **required**): Text to search for
- `textToInsert` (string, **required**): Text to insert after the search text
- `occurrence` (number, *optional*): Which occurrence to insert after (default: 1)

**Returns:**

`AdapterOperationResult`: Insert operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/insertTextAfter" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>","searchText":"<value>","textToInsert":"<value>"}' | jq .
```

### `insertHeading`

Insert a heading into the document

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `text` (string, **required**): Heading text
- `level` (number, **required**): Heading level (1-6)
- `position` (number, *optional*): Character position to insert at
- `insertAfterText` (string, *optional*): Insert after this text instead of at position

**Returns:**

`AdapterOperationResult`: Insert operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/insertHeading" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>","text":"<value>","level":10}' | jq .
```

### `insertList`

Insert a bulleted or numbered list into the document

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `items` (array, **required**): Array of list items
- `listType` (string, **required**): Type of list: "bulleted" or "numbered"
- `position` (number, *optional*): Character position to insert at
- `insertAfterText` (string, *optional*): Insert after this text instead of at position

**Returns:**

`AdapterOperationResult`: Insert operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/insertList" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>","items":[],"listType":"<value>"}' | jq .
```

### `insertTable`

Insert a table into the document

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `data` (array, **required**): 2D array of table data (rows x columns)
- `hasHeader` (boolean, *optional*): Whether the first row is a header (default: true)
- `position` (number, *optional*): Character position to insert at
- `insertAfterText` (string, *optional*): Insert after this text instead of at position

**Returns:**

`AdapterOperationResult`: Insert operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/insertTable" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>","data":[]}' | jq .
```

### `updateDocumentContent`

Replace the entire content of a document

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `newContent` (string, **required**): New content to replace existing content

**Returns:**

`AdapterOperationResult`: Update operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/updateDocumentContent" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"<ID>","newContent":"<value>"}' | jq .
```

### `createSection`

Create a new section with a heading and content. Returns normalized result with insertion details.

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `heading` (string, **required**): Section heading text
- `content` (string, **required**): Section content text

**Returns:**

`AdapterOperationResult`: Normalized section result with documentId, title, url, heading, insertionIndex, success

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/createSection" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"1abc123XYZ","heading":"New Section","content":"Section content here"}' | jq .
```

**Example response:**

```json
{
  "documentId": "1abc123XYZ",
  "title": "My Document",
  "url": "https://docs.google.com/document/d/1abc123XYZ",
  "heading": "New Section",
  "insertionIndex": 156,
  "success": true
}
```

### `findInsertionPoint`

Find the character position for insertion based on position or search text. Returns normalized result with position and context.

**Arguments:**

- `documentId` (string, **required**): ID of the document
- `position` (number, **required**): Position to find (1 for start, -1 for end)
- `searchText` (string, *optional*): Text to search for (returns position after this text)

**Returns:**

`AdapterOperationResult`: Normalized insertion point with documentId, title, url, position, context, documentLength

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDocs/findInsertionPoint" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"documentId":"1abc123XYZ","position":1,"searchText":"Introduction"}' | jq .
```

**Example response:**

```json
{
  "documentId": "1abc123XYZ",
  "title": "My Document",
  "url": "https://docs.google.com/document/d/1abc123XYZ",
  "position": 45,
  "context": "...Introduction paragraph ends here...",
  "documentLength": 1250
}
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
