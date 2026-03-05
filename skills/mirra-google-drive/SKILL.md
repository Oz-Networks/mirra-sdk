---
name: mirra-google-drive
description: "Use Mirra to google drive file storage and management. Covers all Google Drive SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Google Drive

Google Drive file storage and management

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Google Drive requires OAuth authentication. The user must have connected their Google Drive account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `listFiles` | List files in Google Drive |
| `createFile` | Create a new file in Google Drive |
| `createFolder` | Create a new folder in Google Drive |
| `getFileInfo` | Get information about a file |
| `shareFile` | Share a file with others |
| `downloadFile` | Download a file from Google Drive. For Google Docs/Sheets, exports as PDF/XLSX. Returns base64-en... |
| `moveFile` | Move a file to a different folder |
| `deleteFile` | Delete a file or folder. By default moves to trash; set permanently=true to delete forever. |
| `searchFiles` | Search for files using Google Drive query syntax |
| `updateFile` | Update file metadata (name, description) |

## Operation Details

### `listFiles`

List files in Google Drive

**Arguments:**

- `query` (string, *optional*): Search query (Google Drive query syntax)
- `pageSize` (number, *optional*): Maximum number of files to return (default: 20)

**Returns:**

`AdapterOperationResult`: List of normalized files with count, query, and files array

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/listFiles" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

**Example response:**

```json
{
  "count": 2,
  "files": [
    {
      "id": "file_123",
      "name": "Report.pdf",
      "mimeType": "application/pdf",
      "mimeTypeReadable": "PDF",
      "createdAt": "2024-01-15T10:00:00Z",
      "modifiedAt": "2024-01-16T14:30:00Z",
      "isFolder": false
    },
    {
      "id": "folder_456",
      "name": "Documents",
      "mimeType": "application/vnd.google-apps.folder",
      "mimeTypeReadable": "Folder",
      "createdAt": "2024-01-10T08:00:00Z",
      "modifiedAt": "2024-01-10T08:00:00Z",
      "isFolder": true
    }
  ]
}
```

### `createFile`

Create a new file in Google Drive

**Arguments:**

- `name` (string, **required**): Name of the file
- `mimeType` (string, **required**): MIME type of the file
- `folderId` (string, *optional*): Parent folder ID (optional)

**Returns:**

`AdapterOperationResult`: Created file information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/createFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"name":"<value>","mimeType":"<value>"}' | jq .
```

### `createFolder`

Create a new folder in Google Drive

**Arguments:**

- `name` (string, **required**): Name of the folder
- `parentFolderId` (string, *optional*): Parent folder ID (optional)

**Returns:**

`AdapterOperationResult`: Created folder information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/createFolder" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"name":"<value>"}' | jq .
```

### `getFileInfo`

Get information about a file

**Arguments:**

- `fileId` (string, **required**): ID of the file

**Returns:**

`AdapterOperationResult`: Normalized file info with id, name, mimeType, size, dates, owner, etc.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/getFileInfo" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"fileId":"file_abc123"}' | jq .
```

**Example response:**

```json
{
  "id": "file_abc123",
  "name": "Annual Report.pdf",
  "mimeType": "application/pdf",
  "mimeTypeReadable": "PDF",
  "size": 1048576,
  "createdAt": "2024-01-15T10:00:00Z",
  "modifiedAt": "2024-01-20T16:45:00Z",
  "webViewLink": "https://drive.google.com/file/d/file_abc123/view",
  "parents": [
    "folder_parent"
  ],
  "owner": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "isFolder": false,
  "isTrashed": false
}
```

### `shareFile`

Share a file with others

**Arguments:**

- `fileId` (string, **required**): ID of the file to share
- `email` (string, *optional*): Email address to share with (optional)
- `role` (string, *optional*): Permission role: reader, writer, commenter (default: reader)

**Returns:**

`AdapterOperationResult`: Share result with link

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/shareFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"fileId":"<ID>"}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `downloadFile`

Download a file from Google Drive. For Google Docs/Sheets, exports as PDF/XLSX. Returns base64-encoded data.

**Arguments:**

- `fileId` (string, **required**): ID of the file to download

**Returns:**

`AdapterOperationResult`: File data (base64) and mimeType

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/downloadFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"fileId":"<ID>"}' | jq .
```

### `moveFile`

Move a file to a different folder

**Arguments:**

- `fileId` (string, **required**): ID of the file to move
- `folderId` (string, **required**): ID of the destination folder

**Returns:**

`AdapterOperationResult`: Updated file information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/moveFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"fileId":"<ID>","folderId":"<ID>"}' | jq .
```

### `deleteFile`

Delete a file or folder. By default moves to trash; set permanently=true to delete forever.

**Arguments:**

- `fileId` (string, **required**): ID of the file or folder to delete
- `permanently` (boolean, *optional*): If true, permanently delete instead of moving to trash (default: false)

**Returns:**

`AdapterOperationResult`: Delete confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/deleteFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"fileId":"<ID>"}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `searchFiles`

Search for files using Google Drive query syntax

**Arguments:**

- `query` (string, **required**): Search query using Drive syntax (e.g., "name contains 'report'", "mimeType='application/pdf'")
- `pageSize` (number, *optional*): Maximum number of files to return (default: 20)

**Returns:**

`AdapterOperationResult`: List of normalized matching files

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/searchFiles" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"query":"mimeType='application/pdf'"}' | jq .
```

**Example response:**

```json
{
  "count": 1,
  "query": "mimeType='application/pdf'",
  "files": [
    {
      "id": "file_123",
      "name": "Report.pdf",
      "mimeType": "application/pdf",
      "mimeTypeReadable": "PDF",
      "createdAt": "2024-01-15T10:00:00Z",
      "modifiedAt": "2024-01-16T14:30:00Z",
      "isFolder": false
    }
  ]
}
```

### `updateFile`

Update file metadata (name, description)

**Arguments:**

- `fileId` (string, **required**): ID of the file to update
- `name` (string, *optional*): New name for the file
- `description` (string, *optional*): New description for the file

**Returns:**

`AdapterOperationResult`: Updated file information

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleDrive/updateFile" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"fileId":"<ID>"}' | jq .
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
