---
name: mirra-dashboards
description: "Use Mirra to living dashboards — natively-rendered grids of typed widgets (stat, image_card, list, progress, sparkline) that flows keep current by pushing data into them..... Covers all Dashboards SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Dashboards

Living dashboards — natively-rendered grids of typed widgets (stat, image_card, list, progress, sparkline) that flows keep current by pushing data into them. Each dashboard belongs to one space and renders on two surfaces.

**The dashboard** is the full grid: every widget you create lives here. It opens from the Home board, from a push notification, or from an update chip.

**The slice** is that dashboard's card on the reader's Home screen — one headline widget plus a few supporting tiles, the whole card tapping through to the dashboard. Declare it with the `slice` argument on createDashboard, or any time later with updateSlice.

A slice holds widgetIds, not copies of widget data. It is a view, so it repaints itself whenever those widgets are repainted: there is no second write and nothing to keep in sync.

**A dashboard with no slice never appears on Home.** It still exists and still opens, but nothing surfaces it — and for a dashboard built to be glanced at, that is the same as invisible. Declare a slice for anything meant to be checked rather than opened.

Pick the headline by what answers "is anything wrong?" in four seconds. A live alert list or the most recent camera capture almost always beats a counter that reads zero on a normal day.

**Size is a footprint on the board, not a style.** Home is a fixed-row grid, so a slice's height comes from its size and never from how much it has to say: `small` (the default) is one cell and fits 2 tiles, `wide` spans the full row and fits 4, `tall` is a double-height cell and fits 4. Small and wide lay the headline out beside its tiles; tall stacks them, which suits a dashboard whose capture or alert list really is the point. Prefer small — every slice that grows pushes the reader's updates further down a screen they are trying to scan.

Division of labour: widgets for live state, Data collections for durable history, and feed items for notable events that deserve a push notification (pass the dashboardId to createFeedItem so the push opens the dashboard the alert is about).

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
| `createDashboard` | Create a dashboard — a living artifact for this space: a grid of widgets that flows keep current.... |
| `listDashboards` | List the dashboards in this context (id, title, icon, order, widget count). Use to find an existi... |
| `getDashboard` | Get a full dashboard including every widget's definition and current data. Use to inspect current... |
| `deleteDashboard` | Permanently delete a dashboard and all its widgets. It disappears from the Home board immediately... |
| `upsertWidget` | Create a widget or replace its full definition (type, title, size, order, data, staleAfterSeconds... |
| `updateWidgetData` | Repaint a widget's data — the hot path for keeping a dashboard current. Only the data payload cha... |
| `removeWidget` | Remove a widget from a dashboard (e.g. remove a person card when they leave the property). Errors... |
| `updateSlice` | Declare what this dashboard shows on the reader's Home screen. Home renders a board of slices abo... |

## Operation Details

### `createDashboard`

Create a dashboard — a living artifact for this space: a grid of widgets that flows keep current. Pass initial widgets to scaffold the whole dashboard in one call. Each widget needs a stable, caller-chosen widgetId (e.g. "occupancy", "person-jane") so flows can repaint it later with updateWidgetData without tracking server-generated ids. Widget types: "stat" (big number: { value, label?, delta?: { value, direction: "up"|"down"|"flat" }, emphasis?: "default"|"success"|"warning"|"alert" }), "image_card" (snapshot + caption: { image: { url } OR { data: <base64>, mimeType }, title?, caption?, timestamp? }), "list" (compact rows: { items: [{ text, secondaryText?, timestamp?, status?: "ok"|"warn"|"alert"|"neutral", imageUrl?, detail?: { image?: { data: <base64>, mimeType } | { url }, title?, body?, fields?: [{ label, value }] } }], maxVisible? } — a row with a "detail" becomes tappable and opens a modal showing the full capture + metadata, so per-event history like past camera snapshots stays browsable; the detail image is uploaded to the CDN like an image_card and also becomes the row thumbnail when imageUrl is omitted), "progress" (bounded quantity: { value: 0..1, label?, displayText? }), "sparkline" (trend: { points: number[], label?, currentValue? }). Sizes: "full" takes the row, consecutive "half" widgets pair into 2-column rows. Lower order = higher on screen. Always declare a `slice` — the handful of these widgets shown on the reader's Home screen, which is the only place a dashboard can be browsed to. Skip it and this dashboard never appears on Home; it can then be reached only by a push notification or an update chip, which for something built to be glanced at means it is effectively invisible. A slice is what someone reads in four seconds, so lead with the widget that answers "is anything wrong?" rather than the first one you defined. Widget updates are silent — for notable events (e.g. unknown person detected) also create a feed item, which carries the push notification. Pass this dashboard's dashboardId to createFeedItem so the tap opens the dashboard the alert is about.

**Arguments:**

- `title` (string, **required**): Dashboard title shown on the Home board (e.g. "Security")
- `icon` (string, *optional*): Ionicons icon name for the dashboard (e.g. "shield-checkmark-outline")
- `order` (number, *optional*): Position on the Home board among this space's dashboards (default: after existing dashboards)
- `widgets` (array, *optional*): Initial widget definitions: [{ widgetId, type, title?, size?, order?, data, staleAfterSeconds?, tapAction? }]. staleAfterSeconds dims the widget and shows its age when the data is older than this.
- `slice` (object, *optional*): What this dashboard shows on the reader's Home screen: { headline?: widgetId, widgets: [widgetId, ...], size?: "small" | "wide" | "tall" } — one widget rendered large plus supporting tiles, every id referencing a widget defined above. References, not copies: the slice repaints itself as those widgets are updated. size is the card's footprint on the board and caps the tiles: small (default, 2), wide (4, full row), tall (4, double height). Omit slice entirely and this dashboard does not appear on Home at all.

**Returns:**

`AdapterOperationResult`: Returns: dashboardId, title, icon, order, widgetCount, slice (echoed back when one was declared — absent means this dashboard is not on Home), createdAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"createDashboard","params":{"title":"Security","icon":"shield-checkmark-outline","widgets":[{"widgetId":"occupancy","type":"stat","size":"half","order":0,"title":"On property","data":{"value":0,"label":"people"}},{"widgetId":"last-event","type":"stat","size":"half","order":1,"title":"Last activity","data":{"value":"—"}},{"widgetId":"recent-events","type":"list","size":"full","order":100,"title":"Recent events","staleAfterSeconds":3600,"data":{"items":[]}}],"slice":{"headline":"recent-events","widgets":["occupancy","last-event"]}}}' | jq .
```

**Example response:**

```json
{
  "dashboardId": "dash_a1b2c3d4e5f6",
  "title": "Security",
  "icon": "shield-checkmark-outline",
  "order": 0,
  "widgetCount": 3,
  "slice": {
    "headline": "recent-events",
    "widgets": [
      "occupancy",
      "last-event"
    ]
  },
  "createdAt": "2026-07-09T18:00:00.000Z"
}
```

### `listDashboards`

List the dashboards in this context (id, title, icon, order, widget count). Use to find an existing dashboard before creating a duplicate. Each entry reports onHome — whether that dashboard has declared a Home slice — so you can spot the ones nobody can see. Widget data and the slice itself are not included; call getDashboard for either.

**Returns:**

`AdapterOperationResult`: Returns: dashboards (array of { dashboardId, title, icon, order, widgetCount, onHome, updatedAt }), count

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
      "onHome": true,
      "updatedAt": "2026-07-09T18:05:00.000Z"
    },
    {
      "dashboardId": "dash_9f8e7d6c5b4a",
      "title": "Old inventory",
      "icon": "cube-outline",
      "order": 1,
      "widgetCount": 3,
      "onHome": false,
      "updatedAt": "2026-07-02T09:10:00.000Z"
    }
  ],
  "count": 2
}
```

### `getDashboard`

Get a full dashboard including every widget's definition and current data. Use to inspect current widget state (e.g. read the existing recent-events list before appending to it). The response carries the dashboard's `slice` when one is declared — read it to see exactly what Home shows today before you change it. No `slice` field means this dashboard is not on Home.

**Arguments:**

- `dashboardId` (string, **required**): The dashboardId returned by createDashboard or listDashboards

**Returns:**

`AdapterOperationResult`: Returns: dashboard ({ dashboardId, title, icon, order, widgets: [{ widgetId, type, title, size, order, data, staleAfterSeconds, tapAction, updatedAt }], slice ({ headline, widgets }) when declared, createdAt, updatedAt })

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
      },
      {
        "widgetId": "recent-events",
        "type": "list",
        "title": "Recent events",
        "size": "full",
        "order": 100,
        "data": {
          "items": [
            {
              "text": "Jane arrived",
              "secondaryText": "Front gate",
              "status": "ok"
            }
          ]
        },
        "updatedAt": "2026-07-09T18:05:00.000Z"
      }
    ],
    "slice": {
      "headline": "recent-events",
      "widgets": [
        "occupancy"
      ]
    },
    "createdAt": "2026-07-09T18:00:00.000Z",
    "updatedAt": "2026-07-09T18:05:00.000Z"
  }
}
```

### `deleteDashboard`

Permanently delete a dashboard and all its widgets. It disappears from the Home board immediately, along with any unseen-change marks readers were carrying for it.

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

Create a widget or replace its full definition (type, title, size, order, data, staleAfterSeconds, tapAction). Use for structural changes — adding a person card on arrival, changing a widget's size or position. For routine data repaints on an existing widget, use updateWidgetData instead: it can't clobber layout config. For image_card widgets you may pass image as { data: <base64>, mimeType, alt? } — it is uploaded to the CDN and stored as a URL. Never store base64 in widget data. tapAction (optional) makes the widget tappable: { type: "navigate", screen, params? } or { type: "open_url", url }. A new widget lands on the dashboard only — the Home slice is an explicit list, so call updateSlice if this widget also belongs on Home.

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

Repaint a widget's data — the hot path for keeping a dashboard current. Only the data payload changes; layout config (type, title, size, order) is untouched, so a flow on a loop can't clobber it. Errors if the widget doesn't exist (catches typo'd widgetIds) — use upsertWidget to create widgets. The data shape must match the widget's existing type (see createDashboard description). If this widget is on the dashboard's Home slice, the slice repaints with it — a slice references widgetIds, so there is never a second call to make. Updates are silent: no push notification. If the update is notable, also create a feed item — pass this same dashboardId to createFeedItem so the push lands on the widget you just repainted.

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

Remove a widget from a dashboard (e.g. remove a person card when they leave the property). Errors if the widget doesn't exist. The same write drops the widget from the dashboard's Home slice, and clears the slice's headline if this widget was it — a slice can never point at a widget that no longer exists. Removing the headline leaves the remaining tiles on Home; if that empties the slice, the dashboard drops off Home until you declare a new one.

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

### `updateSlice`

Declare what this dashboard shows on the reader's Home screen. Home renders a board of slices above the updates feed; a slice is one headline widget plus a few supporting tiles, and tapping anywhere on it opens the full dashboard. The slice references widgetIds — it is a view, never a copy, so it stays current with no extra writes and there is nothing to keep in sync. A dashboard with no slice does not appear on Home at all, so declare one for anything meant to be glanced at rather than opened. Choose the headline by what answers "is anything wrong?" at a glance: a live alert list or the most recent capture usually beats a counter that reads zero most days. Size is the card's footprint on a fixed-row board, so it decides the height and caps the tiles: "small" (default) is one cell holding 2 tiles, "wide" spans the full row and holds 4, "tall" is a double-height cell holding 4. Small and wide put the headline beside its tiles; tall stacks them, which is worth the height only when the headline is a capture or an alert list that someone actually reads. Prefer small — a slice that grows pushes the reader's updates down a screen they are trying to scan. Rules: every id must already exist on this dashboard (the error names the valid ones), a widget appears once so the headline cannot repeat among the tiles, and declaring more tiles than the size holds is rejected rather than clipped — raise the size or leave the rest on the dashboard itself. Removing a widget prunes it from the slice automatically, so a slice can never go stale. This call replaces the whole slice rather than merging into it, and it notifies nobody: declaring what Home shows is authoring, not news. Pass widgets: [] with no headline to take a dashboard back off Home while leaving it fully intact to open.

**Arguments:**

- `dashboardId` (string, **required**): Dashboard whose Home slice is being declared
- `headline` (string, *optional*): widgetId rendered large at the top of the slice — the one that answers "is anything wrong?"
- `widgets` (array, *optional*): Ordered widgetIds shown as supporting tiles beside (small/wide) or beneath (tall) the headline. Cap depends on size: 2 at small, 4 at wide, 4 at tall. Default: []
- `size` (string, *optional*): Footprint on the Home board: "small" (default — one cell, landscape, 2 tiles), "wide" (full-row, landscape, 4 tiles), "tall" (double-height, headline stacked over 4 tiles). Height comes from this and never from the content.

**Returns:**

`AdapterOperationResult`: Returns: dashboardId, slice ({ headline, widgets, size })

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"dashboards","method":"updateSlice","params":{"dashboardId":"dash_a1b2c3d4e5f6","headline":"recent-events","widgets":["occupancy","last-event"]}}' | jq .
```

**Example response:**

```json
{
  "dashboardId": "dash_a1b2c3d4e5f6",
  "slice": {
    "headline": "recent-events",
    "widgets": [
      "occupancy",
      "last-event"
    ]
  }
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
