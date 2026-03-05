---
name: mirra-google-sheets
description: "Use Mirra to google sheets spreadsheet management and data manipulation. Covers all Google Sheets SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Google Sheets

Google Sheets spreadsheet management and data manipulation

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Google Sheets requires OAuth authentication. The user must have connected their Google Sheets account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createSpreadsheet` | Create a new Google Sheets spreadsheet |
| `readRange` | Read data from a range in a spreadsheet |
| `writeRange` | Write data to a range in a spreadsheet |
| `appendRow` | Append a row to a spreadsheet |
| `getSpreadsheet` | Get spreadsheet metadata and properties |
| `insertAtCell` | Insert a value at a specific cell with optional formatting |
| `insertFormula` | Insert a formula at a specific cell |
| `formatRange` | Apply formatting to a range of cells |
| `createChart` | Create a chart from spreadsheet data |
| `findAndReplace` | Find and replace text in a spreadsheet |
| `insertMultipleRows` | Insert multiple rows of data at once |
| `clearRange` | Clear content from a range of cells |
| `insertRows` | Insert empty rows at a specific position in a sheet. IMPORTANT: Requires numeric sheetId (get fro... |
| `deleteRows` | Delete rows from a sheet. IMPORTANT: Requires numeric sheetId (get from getSpreadsheet), not shee... |
| `insertColumns` | Insert empty columns at a specific position in a sheet. IMPORTANT: Requires numeric sheetId (get ... |
| `deleteColumns` | Delete columns from a sheet. IMPORTANT: Requires numeric sheetId (get from getSpreadsheet), not s... |
| `copyRange` | Copy data from one range to another location within the same spreadsheet. IMPORTANT: Requires num... |

## Operation Details

### `createSpreadsheet`

Create a new Google Sheets spreadsheet

**Arguments:**

- `title` (string, **required**): Title of the spreadsheet

**Returns:**

`AdapterOperationResult`: Created spreadsheet with ID, title, and URL

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/createSpreadsheet" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"title":"Q1 Budget Report"}' | jq .
```

**Example response:**

```json
{
  "spreadsheetId": "1abc123xyz",
  "title": "Q1 Budget Report",
  "url": "https://docs.google.com/spreadsheets/d/1abc123xyz/edit"
}
```

### `readRange`

Read data from a range in a spreadsheet

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `range` (string, **required**): Cell range (e.g., "Sheet1!A1:B10")

**Returns:**

`AdapterOperationResult`: Normalized range data with values, dimensions, and isEmpty flag

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/readRange" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"1abc123xyz","range":"Sheet1!A1:B3"}' | jq .
```

**Example response:**

```json
{
  "spreadsheetId": "1abc123xyz",
  "range": "Sheet1!A1:B3",
  "values": [
    [
      "Name",
      "Age"
    ],
    [
      "Alice",
      30
    ],
    [
      "Bob",
      25
    ]
  ],
  "rowCount": 3,
  "columnCount": 2,
  "isEmpty": false
}
```

### `writeRange`

Write data to a range in a spreadsheet

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `range` (string, **required**): Cell range (e.g., "Sheet1!A1:B10")
- `values` (array, **required**): Data to write (2D array)

**Returns:**

`AdapterOperationResult`: Normalized write result with update counts

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/writeRange" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"1abc123xyz","range":"Sheet1!A1:B2","values":[["Name","Age"],["Alice",30]]}' | jq .
```

**Example response:**

```json
{
  "spreadsheetId": "1abc123xyz",
  "updatedRange": "Sheet1!A1:B2",
  "updatedRows": 2,
  "updatedColumns": 2,
  "updatedCells": 4
}
```

### `appendRow`

Append a row to a spreadsheet

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sheetName` (string, **required**): Name of the sheet
- `values` (array, **required**): Row values to append

**Returns:**

`AdapterOperationResult`: Append operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/appendRow" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sheetName":"<value>","values":[]}' | jq .
```

### `getSpreadsheet`

Get spreadsheet metadata and properties

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet

**Returns:**

`AdapterOperationResult`: Normalized spreadsheet metadata with sheets array

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/getSpreadsheet" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"1abc123xyz"}' | jq .
```

**Example response:**

```json
{
  "spreadsheetId": "1abc123xyz",
  "title": "My Spreadsheet",
  "url": "https://docs.google.com/spreadsheets/d/1abc123xyz/edit",
  "locale": "en_US",
  "timeZone": "America/New_York",
  "sheets": [
    {
      "sheetId": 0,
      "title": "Sheet1",
      "index": 0,
      "rowCount": 1000,
      "columnCount": 26,
      "isHidden": false
    }
  ],
  "namedRanges": []
}
```

### `insertAtCell`

Insert a value at a specific cell with optional formatting

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `cell` (string, **required**): Cell reference in format SheetName!A1
- `value` (string, **required**): Value to insert
- `bold` (boolean, *optional*): Make text bold
- `italic` (boolean, *optional*): Make text italic
- `foregroundColor` (string, *optional*): Text color (hex or named color)
- `backgroundColor` (string, *optional*): Cell background color (hex or named color)

**Returns:**

`AdapterOperationResult`: Insert operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/insertAtCell" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","cell":"<value>","value":"<value>"}' | jq .
```

### `insertFormula`

Insert a formula at a specific cell

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `cell` (string, **required**): Cell reference in format SheetName!A1
- `formula` (string, **required**): Formula to insert (with or without leading =)
- `note` (string, *optional*): Optional note to add to the cell

**Returns:**

`AdapterOperationResult`: Formula insertion result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/insertFormula" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","cell":"<value>","formula":"<value>"}' | jq .
```

### `formatRange`

Apply formatting to a range of cells

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `range` (string, **required**): Range in format SheetName!A1:B10
- `bold` (boolean, *optional*): Make text bold
- `italic` (boolean, *optional*): Make text italic
- `foregroundColor` (string, *optional*): Text color (hex or named color)
- `backgroundColor` (string, *optional*): Cell background color (hex or named color)
- `borders` (boolean, *optional*): Add borders to cells

**Returns:**

`AdapterOperationResult`: Formatting result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/formatRange" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","range":"<value>"}' | jq .
```

### `createChart`

Create a chart from spreadsheet data

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sheetId` (number, **required**): ID of the sheet containing data
- `dataRange` (string, **required**): Data range for the chart (e.g., A1:B10)
- `chartType` (string, **required**): Chart type: BAR, LINE, AREA, PIE, or SCATTER
- `title` (string, **required**): Chart title
- `position` (object, **required**): Chart position with row, column, rowCount, columnCount

**Returns:**

`AdapterOperationResult`: Chart creation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/createChart" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sheetId":10,"dataRange":"<value>","chartType":"<value>","title":"<value>","position":{}}' | jq .
```

### `findAndReplace`

Find and replace text in a spreadsheet

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `findText` (string, **required**): Text to find
- `replaceText` (string, **required**): Text to replace with
- `sheetName` (string, *optional*): Limit search to specific sheet
- `matchCase` (boolean, *optional*): Case-sensitive search
- `matchEntireCell` (boolean, *optional*): Match entire cell content only

**Returns:**

`AdapterOperationResult`: Find and replace result with count of replacements

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/findAndReplace" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","findText":"<value>","replaceText":"<value>"}' | jq .
```

### `insertMultipleRows`

Insert multiple rows of data at once

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sheetName` (string, **required**): Name of the sheet
- `rowsData` (array, **required**): 2D array of row data to insert
- `startingRow` (number, *optional*): Row number to start insertion (1-indexed). If not provided, appends to end
- `formattingOptions` (object, *optional*): Optional formatting to apply (bold, italic, foregroundColor, backgroundColor, borders)

**Returns:**

`AdapterOperationResult`: Multiple row insertion result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/insertMultipleRows" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sheetName":"<value>","rowsData":[]}' | jq .
```

### `clearRange`

Clear content from a range of cells

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sheetName` (string, **required**): Name of the sheet
- `range` (string, **required**): Range to clear (e.g., A1:B10)

**Returns:**

`AdapterOperationResult`: Clear operation result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/clearRange" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sheetName":"<value>","range":"<value>"}' | jq .
```

### `insertRows`

Insert empty rows at a specific position in a sheet. IMPORTANT: Requires numeric sheetId (get from getSpreadsheet), not sheet name. Row indices are 0-indexed (row 1 in UI = index 0).

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sheetId` (number, **required**): Numeric sheet ID (get from getSpreadsheet response: sheets[0].properties.sheetId). This is NOT the sheet name.
- `startRowIndex` (number, **required**): Row index to start inserting at (0-indexed). To insert before row 5 in the UI, use index 4.
- `numRows` (number, **required**): Number of rows to insert

**Returns:**

`AdapterOperationResult`: Insert rows result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/insertRows" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sheetId":10,"startRowIndex":10,"numRows":10}' | jq .
```

### `deleteRows`

Delete rows from a sheet. IMPORTANT: Requires numeric sheetId (get from getSpreadsheet), not sheet name. Row indices are 0-indexed (row 1 in UI = index 0).

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sheetId` (number, **required**): Numeric sheet ID (get from getSpreadsheet response: sheets[0].properties.sheetId). This is NOT the sheet name.
- `startRowIndex` (number, **required**): Row index to start deleting from (0-indexed). To delete row 5 in the UI, use index 4.
- `numRows` (number, **required**): Number of rows to delete

**Returns:**

`AdapterOperationResult`: Delete rows result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/deleteRows" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sheetId":10,"startRowIndex":10,"numRows":10}' | jq .
```

### `insertColumns`

Insert empty columns at a specific position in a sheet. IMPORTANT: Requires numeric sheetId (get from getSpreadsheet), not sheet name. Column indices are 0-indexed (A=0, B=1, C=2, etc.).

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sheetId` (number, **required**): Numeric sheet ID (get from getSpreadsheet response: sheets[0].properties.sheetId). This is NOT the sheet name.
- `startColumnIndex` (number, **required**): Column index to start inserting at (0-indexed: A=0, B=1, C=2, D=3, etc.). To insert before column D, use index 3.
- `numColumns` (number, **required**): Number of columns to insert

**Returns:**

`AdapterOperationResult`: Insert columns result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/insertColumns" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sheetId":10,"startColumnIndex":10,"numColumns":10}' | jq .
```

### `deleteColumns`

Delete columns from a sheet. IMPORTANT: Requires numeric sheetId (get from getSpreadsheet), not sheet name. Column indices are 0-indexed (A=0, B=1, C=2, etc.).

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sheetId` (number, **required**): Numeric sheet ID (get from getSpreadsheet response: sheets[0].properties.sheetId). This is NOT the sheet name.
- `startColumnIndex` (number, **required**): Column index to start deleting from (0-indexed: A=0, B=1, C=2, D=3, etc.). To delete column D, use index 3.
- `numColumns` (number, **required**): Number of columns to delete

**Returns:**

`AdapterOperationResult`: Delete columns result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/deleteColumns" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sheetId":10,"startColumnIndex":10,"numColumns":10}' | jq .
```

### `copyRange`

Copy data from one range to another location within the same spreadsheet. IMPORTANT: Requires numeric sheetIds (get from getSpreadsheet), not sheet names. Can copy within same sheet or across sheets.

**Arguments:**

- `spreadsheetId` (string, **required**): ID of the spreadsheet
- `sourceSheetId` (number, **required**): Numeric sheet ID of the source sheet (get from getSpreadsheet response: sheets[n].properties.sheetId)
- `sourceRange` (string, **required**): Source range in A1 notation WITHOUT sheet name (e.g., "A1:C5", not "Sheet1!A1:C5")
- `targetSheetId` (number, **required**): Numeric sheet ID of the target sheet (can be same as sourceSheetId to copy within same sheet)
- `targetStartCell` (string, **required**): Target start cell in A1 notation (e.g., "E1"). The copied data will fill cells starting from this position.

**Returns:**

`AdapterOperationResult`: Copy range result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/googleSheets/copyRange" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"spreadsheetId":"<ID>","sourceSheetId":10,"sourceRange":"<value>","targetSheetId":10,"targetStartCell":"<value>"}' | jq .
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
