---
name: mirra-pages
description: "Use Mirra to dynamic page creation — create dashboards, reports, and interactive pages with react and tailwind. Covers all Pages SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Pages

Dynamic page creation — create dashboards, reports, and interactive pages with React and Tailwind

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
    "resourceId": "pages",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/pages/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createPage` | Create a new page with JSX code. The code is compiled to HTML with React, Tailwind CSS, Recharts,... |
| `createReportPage` | Create a report page using the widget factory. Instead of writing JSX code, specify a structured ... |
| `upsertReportPage` | Create or update a report page using the widget factory. If a page exists at the given path, it i... |
| `editPage` | Edit a page using search-and-replace. Each edit replaces one exact match of oldCode with newCode ... |
| `updatePage` | Replace the entire page code. Use editPage instead for small changes — it is more efficient. Only... |
| `revertPage` | Revert a page to a previous version. The current code becomes a new version entry. |
| `getPage` | Get a page by its ID or by path within the current graph. Returns page metadata and current code. |
| `listPages` | List all pages for the current graph. Optionally filter by status. |
| `deletePage` | Soft-delete a page by setting its status to "deleted". |
| `publishPage` | Publish a page, making it publicly accessible. Generates an API key for the page. |
| `unpublishPage` | Unpublish a page, making it private. |
| `sharePage` | Share a private page with another graph (group). Members of the target graph will be able to view... |
| `getPageUrl` | Get the public URL for a page. |

## Operation Details

### `createPage`

Create a new page with JSX code. The code is compiled to HTML with React, Tailwind CSS, Recharts, and Lucide icons available as globals. Define a top-level `function App()` component as the entry point. Do NOT use import/require statements — all libraries are pre-loaded via CDN. Use Recharts components directly (e.g. `<BarChart>`, `<ResponsiveContainer>`) and Lucide icons via `lucide.IconName`.

**Arguments:**

- `path` (string, **required**): URL path for the page (e.g. "/dashboard"). Must start with /, lowercase alphanumeric and hyphens only, 2-50 chars.
- `title` (string, **required**): Display title for the page
- `code` (string, *optional*): JSX source code. Must define a top-level function App() component. Do NOT use import/require — React, ReactDOM, Recharts (BarChart, PieChart, LineChart, ResponsiveContainer, etc.), lucide-react, Tailwind CSS, and the Mirra design system (m-* color tokens, font-display/font-body/font-mono, MIRRA_COLORS array) are all pre-loaded globals. Required unless codePath is provided.
- `codePath` (string, *optional*): Path to a JSX file in the workspace container (e.g., "/workspace/pages/dashboard.jsx"). If provided, code is read from this file. Optionally reads .meta.json from the same directory for title/visibility.
- `description` (string, *optional*): Optional description of the page
- `visibility` (string, *optional*): Page visibility: "private" (default) or "public"
- `graphId` (string, *optional*): Optional graph ID for the page's data source (e.g. a group graph for memory queries). The page URL stays under the caller's personal subdomain. The caller must be a member of the target graph.

**Returns:**

`object`: Created page with id, path, title, codeHash, visibility, and url

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"createPage","params":{"path":"/sales-dashboard","title":"Sales Dashboard","code":"function App() {\n  const data = [\n    { month: 'Jan', revenue: 4000, orders: 240 },\n    { month: 'Feb', revenue: 3000, orders: 198 },\n    { month: 'Mar', revenue: 5000, orders: 305 },\n    { month: 'Apr', revenue: 4500, orders: 278 },\n    { month: 'May', revenue: 6000, orders: 389 },\n    { month: 'Jun', revenue: 5500, orders: 342 }\n  ];\n\n  return (\n    <div className=\"min-h-screen p-8 md:p-12\">\n      <h1 className=\"mb-2\">Sales Dashboard</h1>\n      <p className=\"text-m-text-secondary mb-8\">Revenue and order tracking</p>\n      <div className=\"bg-m-surface border border-m-border rounded-xl p-6\">\n        <h3 className=\"mb-4\">Monthly Revenue</h3>\n        <ResponsiveContainer width=\"100%\" height={400}>\n          <LineChart data={data}>\n            <CartesianGrid strokeDasharray=\"3 3\" stroke=\"var(--m-border)\" />\n            <XAxis dataKey=\"month\" stroke=\"var(--m-text-muted)\" />\n            <YAxis stroke=\"var(--m-text-muted)\" />\n            <Tooltip />\n            <Line type=\"monotone\" dataKey=\"revenue\" stroke={MIRRA_COLORS[0]} strokeWidth={2} dot={false} />\n            <Line type=\"monotone\" dataKey=\"orders\" stroke={MIRRA_COLORS[1]} strokeWidth={2} dot={false} />\n          </LineChart>\n        </ResponsiveContainer>\n      </div>\n    </div>\n  );\n}"}}' | jq .
```

### `createReportPage`

Create a report page using the widget factory. Instead of writing JSX code, specify a structured widget spec and the system generates optimized JSX deterministically. Supports 11 widget types: stat-grid, bar-chart, line-chart, area-chart, pie-chart, table, list, metric-card, text-block, treemap, radar-chart. Each widget fetches data from a Data collection at runtime.

**Arguments:**

- `path` (string, **required**): URL path for the page (e.g. "/sales-report"). Must start with /, lowercase alphanumeric and hyphens only.
- `title` (string, **required**): Display title for the report page
- `description` (string, *optional*): Optional subtitle displayed below the title
- `theme` (string, *optional*): Color theme: "dark" (default) or "light"
- `layout` (string, *optional*): Layout: "dashboard" (2-col grid, default), "report" (single-col max-w-4xl), "single-column" (full-width single-col)
- `visibility` (string, *optional*): Page visibility: "private" (default) or "public"
- `widgets` (array, **required**): Array of widget specs. Each widget has: type (string), collection (Data collection slug), transform (optional: { type: "raw"|"groupBy"|"timeSeries", ... }), display ({ title?, height?, colorIndex? }), config (type-specific fields).

Widget types and config:
- stat-grid: { columns, items: [{ label, valueField, format?, aggregate? }] }
- bar-chart: { xField, yField, orientation?, stacked? }
- line-chart: { xField, yFields[], smooth? }
- area-chart: { xField, yFields[], stacked? }
- pie-chart: { labelField, valueField, donut? }
- table: { columns: [{ field, label, format?, align? }], limit? }
- list: { titleField, subtitleField?, metaField?, metaFormat?, limit? }
- metric-card: { valueField, label, format? }
- text-block: { content }
- treemap: { nameField, valueField }
- radar-chart: { axisField, valueFields[] }

Transform types:
- raw: { sort?: { field, direction }, limit? }
- groupBy: { field, metric: { field, op: "sum"|"avg"|"count"|"min"|"max" }, sort?, limit? }
- timeSeries: { timeField, granularity?: "day"|"week"|"month" }

**Returns:**

`object`: Created page with id, path, title, widgetCount, codeHash, url

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"createReportPage","params":{"path":"/telegram-report","title":"Telegram Analytics","layout":"dashboard","widgets":[{"type":"stat-grid","collection":"telegram_messages","transform":{"type":"raw"},"display":{"title":"Overview"},"config":{"columns":3,"items":[{"label":"Total Messages","valueField":"id","format":"count","aggregate":"count"},{"label":"Unique Senders","valueField":"senderId","format":"number","aggregate":"count"},{"label":"Media Count","valueField":"hasMedia","format":"number","aggregate":"sum"}]}},{"type":"bar-chart","collection":"telegram_messages","transform":{"type":"groupBy","field":"senderName","metric":{"field":"id","op":"count"},"sort":{"field":"id","direction":"desc"},"limit":10},"display":{"title":"Top Senders","height":300},"config":{"xField":"_group","yField":"_value","orientation":"horizontal"}},{"type":"area-chart","collection":"telegram_messages","transform":{"type":"timeSeries","timeField":"date","granularity":"day"},"display":{"title":"Messages Over Time","height":250},"config":{"xField":"_time","yFields":["_count"]}}]}}' | jq .
```

### `upsertReportPage`

Create or update a report page using the widget factory. If a page exists at the given path, it is updated with the new widget spec (previous version saved for rollback). If no page exists, it is created. Use this instead of createReportPage when evolving an existing report.

**Arguments:**

- `path` (string, **required**): URL path for the page (e.g. "/agent-report-my-space"). Must start with /, lowercase alphanumeric and hyphens only.
- `title` (string, **required**): Display title for the report page
- `description` (string, *optional*): Optional subtitle displayed below the title
- `theme` (string, *optional*): Color theme: "dark" (default) or "light"
- `layout` (string, *optional*): Layout: "dashboard" (2-col grid, default), "report" (single-col max-w-4xl), "single-column" (full-width single-col)
- `visibility` (string, *optional*): Page visibility: "private" (default) or "public"
- `widgets` (array, **required**): Array of widget specs. Each widget has: type (string), collection (Data collection slug — required for all types except text-block), transform (optional: { type: "raw"|"groupBy"|"timeSeries", ... }), display ({ title?, height? (number), colorIndex? }), config (type-specific fields — see below).

Widget types and their config fields:
- stat-grid: { columns: number, items: [{ label, valueField, format?, aggregate? }] }
- bar-chart: { xField, yField, orientation?, stacked? }
- line-chart: { xField, yFields: string[], smooth? }
- area-chart: { xField, yFields: string[], stacked? }
- pie-chart: { labelField, valueField, donut? }
- table: { columns: [{ field, label, format?, align? }], limit? }
- list: { titleField, subtitleField?, metaField?, limit? }
- metric-card: { valueField, label, format? }
- text-block: { content: string }
- treemap: { nameField, valueField }
- radar-chart: { axisField, valueFields: string[] }

Transform types:
- raw: { sort?: { field, direction }, limit? }
- groupBy: { field, metric: { field, op: "sum"|"avg"|"count"|"min"|"max" }, sort?, limit? }
- timeSeries: { timeField, granularity?: "day"|"week"|"month" }
- `updateReason` (string, *optional*): Why the page is being updated (used as version description for rollback)

**Returns:**

`object`: Created or updated page with id, path, title, widgetCount, codeHash, action ("created" or "updated"), url

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"upsertReportPage","params":{"path":"/agent-report-my-space","title":"My Space Report","layout":"dashboard","updateReason":"Added new chart widget","widgets":[{"type":"stat-grid","collection":"metrics","display":{"title":"Overview"},"config":{"columns":3,"items":[{"label":"Total Items","valueField":"count","aggregate":"sum"},{"label":"Active","valueField":"isActive","aggregate":"count"},{"label":"Latest","valueField":"createdAt","aggregate":"max"}]},"transform":{"type":"raw","limit":100}},{"type":"bar-chart","collection":"metrics","display":{"title":"Items by Category","height":300},"config":{"xField":"_group","yField":"_value"},"transform":{"type":"groupBy","field":"category","metric":{"field":"id","op":"count"},"limit":10}},{"type":"text-block","config":{"content":"Report updated automatically."}}]}}' | jq .
```

**Example response:**

```json
{
  "id": "6650abcd1234ef5678901234",
  "path": "/agent-report-my-space",
  "title": "My Space Report",
  "widgetCount": 3,
  "action": "updated",
  "url": "https://user.withmirra.com/agent-report-my-space"
}
```

### `editPage`

Edit a page using search-and-replace. Each edit replaces one exact match of oldCode with newCode in the current source. Much more efficient than updatePage for small changes — only send the parts that change. Use getPage first to read the current code. The old_code string must appear exactly once in the source.

**Arguments:**

- `pageId` (string, **required**): The page ID to edit
- `edits` (array, **required**): Array of search-and-replace edits. Each edit has oldCode (exact string to find) and newCode (replacement string). Applied sequentially.

**Returns:**

`object`: Updated page with id, title, codeHash, versionsCount, appliedEdits count

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"editPage","params":{"pageId":"6650abcd1234ef5678901234","edits":[{"oldCode":"text-2xl font-bold text-gray-800","newCode":"text-4xl font-semibold text-blue-900"}]}}' | jq .
```

### `updatePage`

Replace the entire page code. Use editPage instead for small changes — it is more efficient. Only use updatePage when rewriting most of the page.

**Arguments:**

- `pageId` (string, **required**): The page ID to update
- `code` (string, *optional*): New JSX source code
- `codePath` (string, *optional*): Path to a JSX file in the workspace container. If provided, code is read from this file.
- `title` (string, *optional*): New title
- `description` (string, *optional*): New description

**Returns:**

`object`: Updated page with id, title, codeHash, versionsCount

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"updatePage","params":{"pageId":"6650abcd1234ef5678901234","code":"function App() {\n  return <div className=\"p-8\"><h1 className=\"text-2xl font-bold\">Updated Page</h1></div>;\n}"}}' | jq .
```

### `revertPage`

Revert a page to a previous version. The current code becomes a new version entry.

**Arguments:**

- `pageId` (string, **required**): The page ID to revert
- `versionIndex` (number, **required**): Index of the version to restore (0 = most recent saved version)

**Returns:**

`object`: Reverted page with id, title, codeHash, versionsCount

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"revertPage","params":{"pageId":"6650abcd1234ef5678901234","versionIndex":0}}' | jq .
```

### `getPage`

Get a page by its ID or by path within the current graph. Returns page metadata and current code.

**Arguments:**

- `pageId` (string, *optional*): The page ID
- `path` (string, *optional*): The page path (e.g. "/dashboard"). Used with the current graphId.

**Returns:**

`object`: Page with id, path, title, description, currentCode, visibility, versions, codeHash

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"getPage","params":{"pageId":"6650abcd1234ef5678901234"}}' | jq .
```

### `listPages`

List all pages for the current graph. Optionally filter by status.

**Arguments:**

- `status` (string, *optional*): Filter by status: "active" (default) or "deleted"

**Returns:**

`object`: Array of pages with id, path, title, description, visibility, status, createdAt, updatedAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"listPages","params":{}}' | jq .
```

### `deletePage`

Soft-delete a page by setting its status to "deleted".

**Arguments:**

- `pageId` (string, **required**): The page ID to delete

**Returns:**

`object`: Confirmation with page id and status

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"deletePage","params":{"pageId":"6650abcd1234ef5678901234"}}' | jq .
```

### `publishPage`

Publish a page, making it publicly accessible. Generates an API key for the page.

**Arguments:**

- `pageId` (string, **required**): The page ID to publish
- `publicCollections` (array, *optional*): Optional array of collection tags for public discovery

**Returns:**

`object`: Published page with id, visibility, apiKey (only shown once), and url

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"publishPage","params":{"pageId":"6650abcd1234ef5678901234"}}' | jq .
```

### `unpublishPage`

Unpublish a page, making it private.

**Arguments:**

- `pageId` (string, **required**): The page ID to unpublish

**Returns:**

`object`: Updated page with id and visibility

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"unpublishPage","params":{"pageId":"6650abcd1234ef5678901234"}}' | jq .
```

### `sharePage`

Share a private page with another graph (group). Members of the target graph will be able to view the page after signing in. The page must belong to your current graph.

**Arguments:**

- `pageId` (string, **required**): The page ID to share
- `graphId` (string, **required**): The graph ID (group ID) to share the page with

**Returns:**

`object`: Updated page with id, title, visibility, sharedWithGraphIds, and accessInfo

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"sharePage","params":{"pageId":"6650abcd1234ef5678901234","graphId":"6650abcd1234ef5678905678"}}' | jq .
```

### `getPageUrl`

Get the public URL for a page.

**Arguments:**

- `pageId` (string, **required**): The page ID

**Returns:**

`object`: Object with url string

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"getPageUrl","params":{"pageId":"6650abcd1234ef5678901234"}}' | jq .
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
