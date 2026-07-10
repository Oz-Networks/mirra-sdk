---
name: mirra-dashboards
description: "Use Mirra to native dashboards on the mobile notifications screen — tabbed grids of typed widgets (stat, image_card, list, progress) that flows keep current. use widgets .... Covers all Dashboards SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Dashboards

Native dashboards on the mobile notifications screen — tabbed grids of typed widgets (stat, image_card, list, progress) that flows keep current. Use widgets for live state, Data collections for history, and feed items for notable events that deserve a push notification.

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
    "resourceId": "dashboards",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/dashboards/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createDashboard` | Create a dashboard — a new tab on the user's notifications screen containing a grid of widgets. P... |
| `listDashboards` | List the dashboards in this context (id, title, icon, order, widget count). Use to find an existi... |
| `getDashboard` | Get a full dashboard including every widget's definition and current data. Use to inspect current... |
| `deleteDashboard` | Permanently delete a dashboard and all its widgets. The tab disappears from the user's device imm... |
| `upsertWidget` | Create a widget or replace its full definition (type, title, size, order, data, staleAfterSeconds... |
| `updateWidgetData` | Repaint a widget's data — the hot path for keeping a dashboard current. Only the data payload cha... |
| `removeWidget` | Remove a widget from a dashboard (e.g. remove a person card when they leave the property). Errors... |

## Operation Details

### `createDashboard`

Create a dashboard — a new tab on the user's notifications screen containing a grid of widgets. Pass initial widgets to scaffold the whole dashboard in one call. Each widget needs a stable, caller-chosen widgetId (e.g. "occupancy", "person-jane") so flows can repaint it later with updateWidgetData without tracking server-generated ids. Widget types: "stat" (big number: { value, label?, delta?: { value, direction: "up"|"down"|"flat" }, emphasis?: "default"|"success"|"warning"|"alert" }), "image_card" (snapshot + caption: { image: { url } OR { data: <base64>, mimeType }, title?, caption?, timestamp? }), "list" (compact rows: { items: [{ text, secondaryText?, timestamp?, status?: "ok"|"warn"|"alert"|"neutral", imageUrl? }], maxVisible? }), "progress" (bounded quantity: { value: 0..1, label?, displayText? }), "sparkline" (trend: { points: number[], label?, currentValue? }). Sizes: "full" takes the row, consecutive "half" widgets pair into 2-column rows. Lower order = higher on screen. Widget updates are silent — for notable events (e.g. unknown person detected) also create a feed item, which carries the push notification.

**Arguments:**

- `title` (string, **required**): Tab label shown on the notifications screen (e.g. "Security")
- `icon` (string, *optional*): Ionicons icon name for the tab (e.g. "shield-checkmark-outline")
- `order` (number, *optional*): Tab order among the user's dashboards (default: after existing tabs)
- `widgets` (array, *optional*): Initial widget definitions: [{ widgetId, type, title?, size?, order?, data, staleAfterSeconds?, tapAction? }]. staleAfterSeconds dims the widget and shows its age when the data is older than this.

**Returns:**

`AdapterOperationResult`: Returns: dashboardId, title, icon, order, widgetCount, createdAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"createDashboard","params":{"title":"Security","icon":"shield-checkmark-outline","widgets":[{"widgetId":"occupancy","type":"stat","size":"half","order":0,"title":"On property","data":{"value":0,"label":"people"}},{"widgetId":"last-event","type":"stat","size":"half","order":1,"title":"Last activity","data":{"value":"—"}},{"widgetId":"recent-events","type":"list","size":"full","order":100,"title":"Recent events","staleAfterSeconds":3600,"data":{"items":[]}}]}}' | jq .
```

**Example response:**

```json
{
  "dashboardId": "dash_a1b2c3d4e5f6",
  "title": "Security",
  "icon": "shield-checkmark-outline",
  "order": 0,
  "widgetCount": 3,
  "createdAt": "2026-07-09T18:00:00.000Z"
}
```

### `listDashboards`

List the dashboards in this context (id, title, icon, order, widget count). Use to find an existing dashboard before creating a duplicate.

**Returns:**

`AdapterOperationResult`: Returns: dashboards (array of { dashboardId, title, icon, order, widgetCount, updatedAt }), count

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"listDashboards","params":{}}' | jq .
```

**Example response:**

```json
{
  "dashboards": [
    {
      "dashboardId": "dash_a1b2c3d4e5f6",
      "title": "Security",
      "icon": "shield-checkmark-outline",
      "order": 0,
      "widgetCount": 5,
      "updatedAt": "2026-07-09T18:05:00.000Z"
    }
  ],
  "count": 1
}
```

### `getDashboard`

Get a full dashboard including every widget's definition and current data. Use to inspect current widget state (e.g. read the existing recent-events list before appending to it).

**Arguments:**

- `dashboardId` (string, **required**): The dashboardId returned by createDashboard or listDashboards

**Returns:**

`AdapterOperationResult`: Returns: dashboard ({ dashboardId, title, icon, order, widgets: [{ widgetId, type, title, size, order, data, staleAfterSeconds, tapAction, updatedAt }], createdAt, updatedAt })

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"getDashboard","params":{"dashboardId":"dash_a1b2c3d4e5f6"}}' | jq .
```

**Example response:**

```json
{
  "dashboard": {
    "dashboardId": "dash_a1b2c3d4e5f6",
    "title": "Security",
    "icon": "shield-checkmark-outline",
    "order": 0,
    "widgets": [
      {
        "widgetId": "occupancy",
        "type": "stat",
        "title": "On property",
        "size": "half",
        "order": 0,
        "data": {
          "value": 2,
          "label": "people"
        },
        "updatedAt": "2026-07-09T18:05:00.000Z"
      }
    ],
    "createdAt": "2026-07-09T18:00:00.000Z",
    "updatedAt": "2026-07-09T18:05:00.000Z"
  }
}
```

### `deleteDashboard`

Permanently delete a dashboard and all its widgets. The tab disappears from the user's device immediately.

**Arguments:**

- `dashboardId` (string, **required**): The dashboardId to delete

**Returns:**

`AdapterOperationResult`: Returns: dashboardId, deleted (true)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"deleteDashboard","params":{"dashboardId":"dash_a1b2c3d4e5f6"}}' | jq .
```

**Example response:**

```json
{
  "dashboardId": "dash_a1b2c3d4e5f6",
  "deleted": true
}
```

### `upsertWidget`

Create a widget or replace its full definition (type, title, size, order, data, staleAfterSeconds, tapAction). Use for structural changes — adding a person card on arrival, changing a widget's size or position. For routine data repaints on an existing widget, use updateWidgetData instead: it can't clobber layout config. For image_card widgets you may pass image as { data: <base64>, mimeType, alt? } — it is uploaded to the CDN and stored as a URL. Never store base64 in widget data. tapAction (optional) makes the widget tappable: { type: "navigate", screen, params? } or { type: "open_url", url }.

**Arguments:**

- `dashboardId` (string, **required**): Dashboard to modify
- `widgetId` (string, **required**): Stable caller-chosen slug (e.g. "person-jane"). Creates the widget if it doesn't exist, replaces it if it does.
- `type` (string, **required**): Widget type: stat | image_card | list | progress | sparkline
- `title` (string, *optional*): Card title shown above the widget content
- `size` (string, *optional*): "full" (whole row, default) or "half" (pairs into 2-column rows)
- `order` (number, *optional*): Sort key within the dashboard; lower = higher on screen (default 0)
- `data` (object, **required**): Type-specific payload — see createDashboard description for shapes per type
- `staleAfterSeconds` (number, *optional*): Client dims the widget and shows its age when data is older than this
- `tapAction` (object, *optional*): Action when the widget is tapped: { type: "navigate", screen, params? } or { type: "open_url", url }

**Returns:**

`AdapterOperationResult`: Returns: dashboardId, widget ({ widgetId, type, title, size, order, data, staleAfterSeconds, tapAction, updatedAt }), created (true if new, false if replaced)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"upsertWidget","params":{"dashboardId":"dash_a1b2c3d4e5f6","widgetId":"person-jane","type":"image_card","size":"half","order":10,"data":{"image":{"data":"<base64-encoded JPEG bytes>","mimeType":"image/jpeg","alt":"Jane at the front gate"},"title":"Jane","caption":"Arrived 2:32 PM","timestamp":"2026-07-09T14:32:00Z"}}}' | jq .
```

**Example response:**

```json
{
  "dashboardId": "dash_a1b2c3d4e5f6",
  "widget": {
    "widgetId": "person-jane",
    "type": "image_card",
    "size": "half",
    "order": 10,
    "data": {
      "image": {
        "url": "https://cdn.example.com/dashboards/u1/images/abc.jpg",
        "aspectRatio": 1.33,
        "alt": "Jane at the front gate"
      },
      "title": "Jane",
      "caption": "Arrived 2:32 PM",
      "timestamp": "2026-07-09T14:32:00Z"
    },
    "updatedAt": "2026-07-09T14:32:05.000Z"
  },
  "created": true
}
```

### `updateWidgetData`

Repaint a widget's data — the hot path for keeping a dashboard current. Only the data payload changes; layout config (type, title, size, order) is untouched, so a flow on a loop can't clobber it. Errors if the widget doesn't exist (catches typo'd widgetIds) — use upsertWidget to create widgets. The data shape must match the widget's existing type (see createDashboard description). Updates are silent: no push notification. If the update is notable, also create a feed item.

**Arguments:**

- `dashboardId` (string, **required**): Dashboard containing the widget
- `widgetId` (string, **required**): The widget to repaint — must already exist
- `data` (object, **required**): Full replacement data payload, shaped for the widget's type

**Returns:**

`AdapterOperationResult`: Returns: dashboardId, widgetId, updatedAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"updateWidgetData","params":{"dashboardId":"dash_a1b2c3d4e5f6","widgetId":"occupancy","data":{"value":3,"label":"people","delta":{"value":"+1","direction":"up"}}}}' | jq .
```

**Example response:**

```json
{
  "dashboardId": "dash_a1b2c3d4e5f6",
  "widgetId": "occupancy",
  "updatedAt": "2026-07-09T14:32:05.000Z"
}
```

### `removeWidget`

Remove a widget from a dashboard (e.g. remove a person card when they leave the property). Errors if the widget doesn't exist.

**Arguments:**

- `dashboardId` (string, **required**): Dashboard containing the widget
- `widgetId` (string, **required**): The widget to remove

**Returns:**

`AdapterOperationResult`: Returns: dashboardId, widgetId, removed (true)

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"removeWidget","params":{"dashboardId":"dash_a1b2c3d4e5f6","widgetId":"person-jane"}}' | jq .
```

**Example response:**

```json
{
  "dashboardId": "dash_a1b2c3d4e5f6",
  "widgetId": "person-jane",
  "removed": true
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
