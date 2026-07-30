---
name: pages
description: "Use Mirra to dynamic page creation — create dashboards, reports, and interactive pages with react and tailwind. Covers all Pages SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Pages

Dynamic page creation — create dashboards, reports, and interactive pages with React and Tailwind

## What pages are for

A page is the surface a teammate can actually *look at*. Most work has no
viewable surface — an API change, a refactor, a migration — and a PR is a
viewable surface only for the developers on the team. A page fixes that, in two
different moments:

- **A draft**, published the moment the thing exists: a prototype, a mockup, a
  plan, two options you want decided between. Teammates pin comments directly
  onto it, so it comes back as specific feedback on specific parts.
- **A receipt**, published when work lands: evidence that the invisible thing
  happened, and the face of your update card.

The ritual for both — which ledger op attaches the page, and when — lives in
the **`mirra:ledger`** skill. Read it before publishing a page for your team;
a page nobody attaches or mentions is a page nobody sees.

## Read the comments back with `listFeedback`

Pages served in the Mirra app carry a comment widget: a viewer clicks an
element and leaves a note pinned to it. Read them with the pages op:

```
listFeedback({ path: "/calendar-design-lab" })   # or { pageId }
resolveFeedback({ feedbackId })                  # once you have made the change
```

Each comment carries the words the viewer wrote AND the element they were
pointing at, so treat it as a specific change request. `stale: true` means the
page has been edited since — re-read it before assuming the comment still
applies. `mirra:feedback` is unrelated (it files bugs against Mirra itself).

Do this on the way IN as well as out: before editing a page a teammate has been
reviewing, read the open comments first, or you will overwrite the thing they
asked for.

Two things worth knowing before you publish:

- **Scope the call the way you scope the ledger.** The page belongs to the
  graph in your request scope, so publish a team page with `X-Scope: group` +
  `X-Group-Id`. Created under a personal scope it is a personal page, and your
  teammates cannot open it or comment on it. (The optional `graphId` argument
  does NOT do this — it only picks the graph a page queries for data.)
- **Say it wants eyes.** Publishing is silent. Post the link in the space chat
  (`mirra:messaging`) and say what you need decided.

## Writing the JSX

- Define a top-level `function App()`. No `import` or `require` — React,
  Recharts, `lucide.IconName`, Tailwind, and the Mirra design system are all
  pre-loaded globals.
- **Use the `m-*` color tokens, not Tailwind's palette.** `bg-m-bg`,
  `bg-m-surface`, `bg-m-surface-alt`, `border-m-border`, `text-m-text`,
  `text-m-text-secondary`, `text-m-text-muted`, `text-m-accent`,
  `bg-m-accent-soft`, `text-m-accent-text`; type is `font-display` /
  `font-body` / `font-mono`; `MIRRA_COLORS` is the chart palette. Pages render
  **dark by default**, so `text-gray-800` or `bg-white` quietly produces
  unreadable text on a viewer's screen.
- One screenful beats a long scroll. A teammate opens it on a phone, from a
  feed, and gives it a glance.
- If the page will be an update card's picture it gets screenshotted at
  **900×540** and shown at about a third of that. That is a different design
  problem — start from `poster.jsx` in the `mirra:ledger` skill, which has the
  measured type scale already set, and pass `purpose: "poster"` so it stays out
  of the artifacts library. A poster is a picture that happens to be built out
  of a page; the library lists things people open.
- Use `editPage` for small changes; `updatePage` rewrites the whole source.
- Structured dashboards over live Data collections don't need hand-written JSX
  at all — `createReportPage` / `upsertReportPage` generate them from a widget
  spec.

## When a write is rejected

Every write op — create, edit, update, and the report-page pair — type-checks
and compiles the source before it saves anything. Source that doesn't compile
comes back as **`400 VALIDATION_ERROR`**, and the error is the fix: the message
carries the formatted diagnostics, and `error.details.issues` carries them
structured — `{ severity, message, line, column }`, with `line` counted in your
own source. Nothing is written when a page fails to compile, so correct the code
and resend the same call. A `500` from these ops means a server fault, not your
JSX.

The trap on the edit path is changing a helper's signature: adding a parameter
without a default breaks every call site you didn't touch, and the compiler
reports it as `TS2554: Expected 2 arguments, but got 1`. Read the current source
with `getPage` before an `editPage` if you are unsure what else calls it.

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
| `shareToOrg` | Share one of this space's pages with the whole organization. By default a page this space publish... |
| `getPageUrl` | Get the public URL for a page. |
| `listFeedback` | Read the comments teammates pinned onto one of your pages. A viewer clicks an element on the page... |
| `resolveFeedback` | Close a page comment once you have acted on it, so it stops coming back from listFeedback. Resolv... |

## Operation Details

### `createPage`

Create a new page with JSX code. The code is compiled to HTML with React, Tailwind CSS, Recharts, and Lucide icons available as globals. Define a top-level `function App()` component as the entry point. Do NOT use import/require statements — all libraries are pre-loaded via CDN. Use Recharts components directly (e.g. `<BarChart>`, `<ResponsiveContainer>`) and Lucide icons via `lucide.IconName`.

**Arguments:**

- `path` (string, **required**): URL path for the page (e.g. "/dashboard"). Must start with /, lowercase alphanumeric and hyphens only, 2-50 chars.
- `title` (string, *optional*): Display title for the page. Required unless codePath is provided (can be read from .meta.json).
- `code` (string, *optional*): Page source, in either format. JSX: must define a top-level function App() component, no import/require — React, ReactDOM, Recharts (BarChart, PieChart, LineChart, ResponsiveContainer, etc.), lucide-react, Tailwind CSS, and the Mirra design system (m-* color tokens, font-display/font-body/font-mono, MIRRA_COLORS array) are pre-loaded globals. HTML: a self-contained document with inline CSS/JS and no external requests — the Claude Artifact shape, stored and served verbatim, with no page shell and no data hooks. The format is detected automatically; pass `format` to be explicit. Required unless codePath is provided.
- `format` (string, *optional*): Force the source format: "jsx" or "html". Normally omitted — a document starting with <!doctype html> or <html> is treated as HTML and everything else as JSX.
- `codePath` (string, *optional*): Path to a source file in the workspace container (e.g., "/workspace/pages/dashboard.jsx" or ".../page.html"). If provided, code is read from this file. Optionally reads .meta.json from the same directory for title/visibility.
- `description` (string, *optional*): Optional description of the page
- `visibility` (string, *optional*): Page visibility: "private" (default) or "public"
- `graphId` (string, *optional*): Optional graph ID for the page's data source (e.g. a group graph for memory queries). The page URL stays under the caller's personal subdomain. The caller must be a member of the target graph.
- `purpose` (string, *optional*): Set to "poster" when the page is the 900x540 picture that leads an update card — one line or one number set very large, meant to be looked at rather than read. Posters are kept out of the artifacts library, because a library lists things people open and a poster is not one of them. Omit for every normal page.

**Returns:**

`object`: Created page with id, path, title, codeHash, visibility, and url

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"createPage","params":{"path":"/sales-dashboard","codePath":"/workspace/pages/sales-dashboard.jsx"}}' | jq .
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
- `code` (string, *optional*): New page source, JSX or a self-contained HTML document. The format is detected automatically and may differ from the page's current one — replacing a JSX page with an artifact is a valid update.
- `format` (string, *optional*): Force the source format: "jsx" or "html". Normally omitted — see createPage.
- `codePath` (string, *optional*): Path to a source file in the workspace container. If provided, code is read from this file.
- `title` (string, *optional*): New title
- `description` (string, *optional*): New description

**Returns:**

`object`: Updated page with id, title, codeHash, versionsCount

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"updatePage","params":{"pageId":"6650abcd1234ef5678901234","codePath":"/workspace/pages/my-page.jsx"}}' | jq .
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

### `shareToOrg`

Share one of this space's pages with the whole organization. By default a page this space publishes is readable only inside this space, even though it is stored in the organization's namespace — sibling spaces cannot see it. Use this for the pages that genuinely are company-wide. There is no un-share op yet; treat it as a one-way decision.

**Arguments:**

- `pageId` (string, **required**): The page ID to share with the organization

**Returns:**

`object`: Updated page with id, title, visibility, sharedWithGraphIds, and accessInfo

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"shareToOrg","params":{"pageId":"6650abcd1234ef5678901234"}}' | jq .
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

### `listFeedback`

Read the comments teammates pinned onto one of your pages. A viewer clicks an element on the page and leaves a note attached to it, so each comment comes back with the text they wrote AND the part of the page they were pointing at — treat it as a specific change request, not general feedback.

**Arguments:**

- `pageId` (string, *optional*): The page ID. Get one from listPages or from the createPage result.
- `path` (string, *optional*): The page path instead of an ID (e.g. "/calendar-design-lab"), resolved within the current graph.
- `status` (string, *optional*): Which comments to return: "open" (default), "resolved", or "all".

**Returns:**

`object`: Page identity plus a comments array (text, who wrote it, what they pointed at, whether it is stale) and open/resolved counts

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"listFeedback","params":{"path":"/calendar-design-lab"}}' | jq .
```

### `resolveFeedback`

Close a page comment once you have acted on it, so it stops coming back from listFeedback. Resolve it when the change is actually made — not when you have read it. Pass status "open" to reopen one you closed too early.

**Arguments:**

- `feedbackId` (string, **required**): The comment ID, from listFeedback.
- `status` (string, *optional*): "resolved" (default) or "open" to reopen.

**Returns:**

`object`: The comment with its new status and the page it belongs to

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"pages","method":"resolveFeedback","params":{"feedbackId":"6a6a3e8876d577eaae1c3d3c"}}' | jq .
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
