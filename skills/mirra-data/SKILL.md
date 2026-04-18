---
name: mirra-data
description: "Use Mirra to structured data storage -- define collections, insert records, query, and aggregate data. Covers all Data SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Data

Structured data storage -- define collections, insert records, query, and aggregate data

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
    "resourceId": "data",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/data/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `defineCollection` | Create a new data collection (schema). Define the fields and their types. A slug is auto-generate... |
| `listCollections` | List all data collections for the current context. Optionally filter by status. |
| `getCollection` | Get a single collection schema by its slug. |
| `updateCollection` | Update a collection schema. Add new fields, remove existing fields, or update the description. Fi... |
| `dropCollection` | Archive a collection and delete all its records. The schema is marked as archived and all associa... |
| `insertRecord` | Insert a single record into a collection. Data is validated against the collection schema. Quota ... |
| `insertRecords` | Batch insert multiple records into a collection. All records are validated against the schema. Qu... |
| `queryRecords` | Query records from a collection with optional filtering, sorting, and pagination. Filters use Mon... |
| `updateRecord` | Update a single record by its ID. Data is validated against the collection schema. |
| `deleteRecord` | Delete a single record by its ID. Quota is decremented by the record size. |
| `deleteRecords` | Bulk delete records by a list of IDs. Returns the count deleted, bytes freed, and any IDs that we... |
| `deleteWhere` | Delete all records in a collection that match a filter. Filter must be non-empty — to clear an en... |
| `aggregate` | Run aggregation on a collection. Supports sum, avg, count, min, max grouped by a field. |
| `getQuotaUsage` | Get the current storage quota usage for this context. |

## Operation Details

### `defineCollection`

Create a new data collection (schema). Define the fields and their types. A slug is auto-generated from the name if not provided.

**Arguments:**

- `name` (string, **required**): Human-readable name for the collection (e.g. "Contacts", "Sales Metrics")
- `slug` (string, *optional*): URL-safe identifier (lowercase, underscores). Auto-generated from name if omitted.
- `fields` (array, **required**): Array of field definitions. Each field has: name (string), type ("string"|"number"|"boolean"|"date"|"array"|"object"), required (boolean), description (optional string).
- `description` (string, *optional*): Optional description of what this collection stores
- `path` (string, *optional*): Path to a JSON file in the workspace container (e.g., "/workspace/data/collections/contacts.schema.json"). If provided, reads { name, fields, description } from the file. Explicit args override file values.

**Returns:**

`AdapterOperationResult`: The created collection schema

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"defineCollection","params":{"name":"Contacts","fields":[{"name":"firstName","type":"string","required":true,"description":"First name"},{"name":"lastName","type":"string","required":true,"description":"Last name"},{"name":"email","type":"string","required":false,"description":"Email address"},{"name":"phone","type":"string","required":false},{"name":"company","type":"string","required":false}],"description":"Customer contacts directory"}}' | jq .
```

### `listCollections`

List all data collections for the current context. Optionally filter by status.

**Arguments:**

- `status` (string, *optional*): Filter by status: "active" (default) or "archived"

**Returns:**

`AdapterOperationResult`: Array of collection schemas

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"listCollections","params":{}}' | jq .
```

### `getCollection`

Get a single collection schema by its slug.

**Arguments:**

- `slug` (string, **required**): The collection slug (e.g. "contacts")

**Returns:**

`AdapterOperationResult`: The collection schema with field definitions

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"getCollection","params":{"slug":"contacts"}}' | jq .
```

### `updateCollection`

Update a collection schema. Add new fields, remove existing fields, or update the description. Field changes are non-destructive -- existing records are not modified.

**Arguments:**

- `slug` (string, **required**): The collection slug to update
- `addFields` (array, *optional*): New fields to add to the collection
- `removeFields` (array, *optional*): Field names to remove from the collection
- `description` (string, *optional*): New description for the collection

**Returns:**

`AdapterOperationResult`: The updated collection schema

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"updateCollection","params":{"slug":"contacts","addFields":[{"name":"notes","type":"string","required":false}]}}' | jq .
```

### `dropCollection`

Archive a collection and delete all its records. The schema is marked as archived and all associated records are permanently deleted. Quota is decremented.

**Arguments:**

- `slug` (string, **required**): The collection slug to drop

**Returns:**

`AdapterOperationResult`: Confirmation with the number of deleted records

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"dropCollection","params":{"slug":"sales_metrics"}}' | jq .
```

### `insertRecord`

Insert a single record into a collection. Data is validated against the collection schema. Quota is checked before writing.

**Arguments:**

- `collection` (string, **required**): The collection slug to insert into
- `data` (object, **required**): The record data -- keys must match the collection fields

**Returns:**

`AdapterOperationResult`: The created record with its ID

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"insertRecord","params":{"collection":"contacts","data":{"firstName":"Jane","lastName":"Smith","email":"jane@example.com","company":"Acme Inc"}}}' | jq .
```

### `insertRecords`

Batch insert multiple records into a collection. All records are validated against the schema. Quota is checked for the total size.

**Arguments:**

- `collection` (string, **required**): The collection slug to insert into
- `records` (array, **required**): Array of record data objects to insert

**Returns:**

`AdapterOperationResult`: Array of created records with their IDs

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"insertRecords","params":{"collection":"sales_metrics","records":[{"date":"2025-06-15","revenue":14500,"unitsSold":230,"region":"North America","product":"Widget Pro"},{"date":"2025-06-15","revenue":8200,"unitsSold":120,"region":"Europe","product":"Widget Lite"},{"date":"2025-06-16","revenue":16100,"unitsSold":250,"region":"North America","product":"Widget Pro"}]}}' | jq .
```

### `queryRecords`

Query records from a collection with optional filtering, sorting, and pagination. Filters use MongoDB-style syntax (e.g. { revenue: { $gt: 10000 } }).

**Arguments:**

- `collection` (string, **required**): The collection slug to query
- `filter` (object, *optional*): MongoDB-style filter object. Supports $eq, $ne, $gt, $gte, $lt, $lte, $in, $regex. Filter keys are automatically prefixed with "data." so use field names directly.
- `sort` (object, *optional*): Sort object, e.g. { revenue: -1 } for descending. Keys are auto-prefixed with "data.".
- `limit` (number, *optional*): Max records to return (default 50, max 200)
- `offset` (number, *optional*): Number of records to skip (for pagination)

**Returns:**

`AdapterOperationResult`: Object with `records` (array of { id, data, createdAt, updatedAt }) and `pagination` ({ totalCount, limit, offset, hasMore }). Each record's `data` field contains the flat object with your collection fields (e.g. { firstName: "Jane", email: "jane@example.com" })

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"queryRecords","params":{"collection":"contacts"}}' | jq .
```

**Example response:**

```json
{
  "records": [
    {
      "id": "rec_abc123",
      "data": {
        "firstName": "Jane",
        "lastName": "Doe",
        "email": "jane@example.com"
      },
      "createdAt": "2026-01-15T10:30:00Z"
    },
    {
      "id": "rec_def456",
      "data": {
        "firstName": "John",
        "lastName": "Smith",
        "email": "john@example.com"
      },
      "createdAt": "2026-01-16T14:00:00Z"
    }
  ],
  "pagination": {
    "totalCount": 2,
    "limit": 50,
    "offset": 0,
    "hasMore": false
  }
}
```

### `updateRecord`

Update a single record by its ID. Data is validated against the collection schema.

**Arguments:**

- `collection` (string, **required**): The collection slug
- `recordId` (string, **required**): The record _id to update
- `data` (object, **required**): Partial record data to merge/update

**Returns:**

`AdapterOperationResult`: The updated record

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"updateRecord","params":{"collection":"contacts","recordId":"665a1b2c3d4e5f6789012345","data":{"email":"jane.smith@newdomain.com"}}}' | jq .
```

### `deleteRecord`

Delete a single record by its ID. Quota is decremented by the record size.

**Arguments:**

- `collection` (string, **required**): The collection slug
- `recordId` (string, **required**): The record _id to delete

**Returns:**

`AdapterOperationResult`: Confirmation of deletion

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"deleteRecord","params":{"collection":"contacts","recordId":"665a1b2c3d4e5f6789012345"}}' | jq .
```

### `deleteRecords`

Bulk delete records by a list of IDs. Returns the count deleted, bytes freed, and any IDs that were not found. Prefer this over looping deleteRecord when removing multiple known records.

**Arguments:**

- `collection` (string, **required**): The collection slug
- `recordIds` (array, **required**): Array of record _id values to delete (max 1000 per call)

**Returns:**

`AdapterOperationResult`: Deletion summary: deletedCount, freedBytes, missingIds

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"deleteRecords","params":{"collection":"contacts","recordIds":["665a1b2c3d4e5f6789012345","665a1b2c3d4e5f6789012346","665a1b2c3d4e5f6789012347"]}}' | jq .
```

### `deleteWhere`

Delete all records in a collection that match a filter. Filter must be non-empty — to clear an entire collection, use dropCollection instead. Supports the same filter syntax as queryRecords.

**Arguments:**

- `collection` (string, **required**): The collection slug
- `filter` (object, **required**): Non-empty filter object. Same syntax as queryRecords.filter (e.g. { status: "archived" } or { createdAt: { $lt: "2025-01-01" } }).

**Returns:**

`AdapterOperationResult`: Deletion summary: deletedCount, freedBytes

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"deleteWhere","params":{"collection":"tasks","filter":{"status":"archived"}}}' | jq .
```

### `aggregate`

Run aggregation on a collection. Supports sum, avg, count, min, max grouped by a field.

**Arguments:**

- `collection` (string, **required**): The collection slug
- `groupBy` (string, *optional*): Field name to group by. Omit for overall aggregation.
- `metrics` (array, **required**): Array of { field, op } where op is one of "sum", "avg", "count", "min", "max". For "count", field can be omitted.

**Returns:**

`AdapterOperationResult`: Aggregation results grouped by the specified field

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"aggregate","params":{"collection":"sales_metrics","groupBy":"region","metrics":[{"field":"revenue","op":"sum"},{"field":"unitsSold","op":"sum"},{"field":"revenue","op":"avg"}]}}' | jq .
```

### `getQuotaUsage`

Get the current storage quota usage for this context.

**Returns:**

`AdapterOperationResult`: Current bytes used, max bytes, and percentage used

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"data","method":"getQuotaUsage","params":{}}' | jq .
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
