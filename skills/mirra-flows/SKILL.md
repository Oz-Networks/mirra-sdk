---
name: mirra-flows
description: "Use Mirra to internal automation system for time-based and event-based task execution. Covers all Flows SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Flows

Internal automation system for time-based and event-based task execution

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
    "resourceId": "flows",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/flows/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `createFlow` | Create a flow (event-triggered or time-scheduled). This is the unified, simplified interface for ... |
| `createTimeFlow` | Create a new time-based flow with cron schedule. NOTE: Consider using createFlow instead for a si... |
| `createEventFlow` | Create an event-based flow with pre-filtering conditions. NOTE: Consider using createFlow instead... |
| `getFlow` | Get a specific flow by ID. Returns normalized flat structure. Use includeScript=true to also retu... |
| `updateFlow` | Update an existing flow. Returns normalized flat structure. |
| `modifyFlowScript` | Replace the ENTIRE script code for a flow. For small changes, prefer editFlowScript instead — it ... |
| `readFlowScript` | Read the script code for a flow with line numbers. Supports optional line range to read a portion... |
| `editFlowScript` | Apply surgical edits to a flow's script code using oldText/newText pairs. Each edit replaces an e... |
| `executeFlow` | Execute a flow on-demand with custom input. The input object is merged into the flow's scriptInpu... |
| `deleteFlow` | Delete a flow |
| `pauseFlow` | Pause an active flow. Returns normalized flat structure. |
| `resumeFlow` | Resume a paused flow. Returns normalized flat structure. |
| `searchFlows` | Search flows with filters. Default returns minimal info (id, title, status, triggerType, isActive... |
| `recordExecution` | Record execution result for a flow. Returns normalized flat structure. |
| `listEventTypes` | List available event types that can trigger automations. Returns normalized event types. Filter b... |
| `testFlow` | Test a flow by generating an event that matches the trigger conditions. |
| `validateTrigger` | Check if a custom event would match a flow trigger without any execution. Useful for debugging tr... |
| `getFlowsByEventType` | Get all active flows triggered by a specific event type. Default returns minimal info (id, title,... |
| `createBatchOperation` | Create a self-managing flow that processes multiple adapter operations over time, respecting rate... |
| `publishFlow` | Publish a flow to the marketplace so other users can discover and install it. The flow must have ... |
| `unpublishFlow` | Remove a flow from the marketplace. Existing installations will continue to work. |

## Operation Details

### `createFlow`

Create a flow (event-triggered or time-scheduled). This is the unified, simplified interface for flow creation.

**Arguments:**

- `title` (string, *optional*): Flow title. Required if providing inline code.
- `description` (string, *optional*): Detailed description of what the flow does
- `code` (string, *optional*): Inline script code. If provided, auto-creates, deploys, and links the script. Cannot use with scriptId.
- `scriptId` (string, *optional*): ID of existing deployed script. Cannot use with code.
- `schedule` (string, *optional*): Cron expression for time-based flows. Times are automatically evaluated in the user's local timezone. Example: "0 9 * * *" runs at 9am in the user's timezone.
- `eventType` (string, *optional*): Event type shorthand (e.g., "telegram.message"). Use ONLY when you need to process every single event of this type. For filtering a subset of events, use eventFilter instead.
- `eventFilter` (object, *optional*): Event filter for pre-filtering events before the script runs (evaluated in-memory, free).

SIMPLE FORMAT (recommended): Pass a flat object with "when" set to the event type, then field aliases as keys.
  { "when": "telegram.bot_message", "chat_id": "-1001234567890", "message_text_contains": "urgent" }

Add _contains, _gt, _lt, _not, _starts_with, _ends_with, _matches, _in suffixes for non-equals operators.
Default operator is equals when no suffix is given. Arrays auto-detect as "in" operator.

VALID FIELD ALIASES per event type (use these — do NOT use event.data.* paths here):
  telegram.bot_message: chat_id, chat_type, sender_username, sender_user_id, message_text, bot_username, has_media, media_type
  telegram.bot_command: command, chat_id, chat_type, sender_username, sender_user_id, bot_username
  telegram.bot_callback_query: chat_id, callback_data, sender_username, bot_username
  telegram.message: chat_id, is_group_chat, has_media, message_text
  gmail.email_received: from_email, from_name, subject, has_attachments, is_unread, body_text
  call.ended: duration_seconds, was_recorded, scope
  crypto_price_update: price_usd, token_address, chain
  recording.transcribed: duration_seconds, speaker_count, transcript_text
  flow.complete: flow_title, flow_success, flow_type
  All event types: event_type, sender_name, sender_id, content_text, channel_id, channel_name

ADVANCED FORMAT (full condition tree — for OR logic, regex, or nested conditions):
  { "operator": "or", "conditions": [
    { "operator": "equals", "field": "bot.chatId", "value": "123" },
    { "operator": "equals", "field": "bot.chatId", "value": "456" }
  ]}

Valid operators: equals, notEquals, contains, startsWith, endsWith, greaterThan, lessThan, in, notIn, exists, notExists, matchesRegex, and, or, not
- `trigger` (object, *optional*): Legacy nested trigger structure. Prefer eventType or eventFilter instead.
- `scriptInput` (object, *optional*): Static input data passed to the script. Fields are spread into event.data, so scriptInput: { apiKey: "sk-123" } is accessed as event.data.apiKey in handler code. The linter validates code against these fields.
- `scriptInputSchema` (object, *optional*): Schema describing scriptInput fields (auto-inferred from scriptInput values if not provided). Keys are field names, values are { type: "string"|"number"|"boolean"|"object"|"array", required?: boolean, description?: string }. When provided, the linter can catch typos in event.data.fieldName access as errors instead of warnings.
- `enabled` (boolean, *optional*): Whether the flow is enabled (default: true)
- `webhook` (boolean, *optional*): Set to true to create a webhook-triggered flow. Returns a webhookUrl in the response. External services POST to this URL to trigger the flow. The request body is available as event.data.body in the handler.
- `parentSpaceId` (string, *optional*): Group/space ID to scope this flow to. When set, the flow executes with group context and accesses the group's data instead of the user's personal data. If omitted, auto-inherited from the current group context (if any).

**Returns:**

`NormalizedFlow`: Returns FLAT flow object with: id, title, description, status, scope, userId, parentSpaceId, triggerType, cronExpression, timezone, eventFilter, scriptId, scriptInstallationId, scriptInput, scriptInputSchema, executionCount, lastExecutedAt, createdAt, updatedAt, version, feedItemId, isActive, isTimeBased, isEventBased. For webhook flows, also includes webhookUrl and webhookId. No nested trigger object.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"createFlow","params":{"title":"Weather Command","eventFilter":{"when":"telegram.bot_command","command":"/weather"},"code":"export async function handler(event, context, mirra) { const chatId = event.fields.chat_id; const messageId = event.data.bot.messageId; await mirra.telegramBot.replyToMessage({ chatId, replyToMessageId: messageId, text: \"Checking weather...\" }); return { handled: true }; }"}}' | jq .
```

### `createTimeFlow`

Create a new time-based flow with cron schedule. NOTE: Consider using createFlow instead for a simpler interface with inline code support.

**Arguments:**

- `title` (string, **required**): Flow title
- `description` (string, **required**): Detailed description of what the flow does
- `schedule` (string, **required**): Cron expression for scheduling (e.g., "0 9 * * *" for daily at 9am)
- `scriptId` (string, **required**): ID of the script to execute when triggered
- `scriptInput` (object, *optional*): Static input data passed to the script. Fields are spread into event.data (e.g., scriptInput: { apiKey: "sk-123" } → event.data.apiKey in handler).
- `scriptInputSchema` (object, *optional*): Schema describing scriptInput fields (auto-inferred from scriptInput values if not provided). Keys are field names, values are { type, required?, description? }.

**Returns:**

`NormalizedFlow`: Returns FLAT flow object with: id, title, description, status, scope, userId, triggerType, cronExpression, timezone, eventFilter, scriptId, scriptInstallationId, scriptInput, scriptInputSchema, executionCount, lastExecutedAt, createdAt, updatedAt, version, feedItemId, isActive, isTimeBased, isEventBased. No nested trigger object.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"createTimeFlow","params":{"title":"<value>","description":"<value>","schedule":"<value>","scriptId":"<ID>"}}' | jq .
```

### `createEventFlow`

Create an event-based flow with pre-filtering conditions. NOTE: Consider using createFlow instead for a simpler interface with inline code support.

**Arguments:**

- `title` (string, **required**): Flow title
- `description` (string, **required**): Detailed description of what the flow does
- `trigger` (object, **required**): Event filter conditions that determine WHEN the script runs. Add ALL filtering logic here to minimize Lambda invocations. Must have type:"event" and config.eventFilter with operator and conditions array.
- `scriptId` (string, **required**): ID of the script to execute when triggered
- `scriptInput` (object, *optional*): Static input data passed to the script. Fields are spread into event.data (e.g., scriptInput: { apiKey: "sk-123" } → event.data.apiKey in handler).
- `scriptInputSchema` (object, *optional*): Schema describing scriptInput fields (auto-inferred from scriptInput values if not provided). Keys are field names, values are { type, required?, description? }.

**Returns:**

`NormalizedFlow`: Returns FLAT flow object with: id, title, description, status, scope, userId, triggerType, cronExpression, timezone, eventFilter, scriptId, scriptInstallationId, scriptInput, scriptInputSchema, executionCount, lastExecutedAt, createdAt, updatedAt, version, feedItemId, isActive, isTimeBased, isEventBased. No nested trigger object.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"createEventFlow","params":{"title":"VIP Message Handler","description":"Process messages from VIP contact","trigger":{"type":"event","config":{"eventFilter":{"operator":"and","conditions":[{"operator":"equals","field":"type","value":"telegram.message"},{"operator":"equals","field":"actor.id","value":"12345"}]}}},"scriptId":"script-id-here"}}' | jq .
```

### `getFlow`

Get a specific flow by ID. Returns normalized flat structure. Use includeScript=true to also return the flow's script code.

**Arguments:**

- `id` (string, **required**): Flow ID (24-character hex string returned by createFlow/createEventFlow). Get IDs from the flow creation response or by searching flows.
- `includeScript` (boolean, *optional*): Include the flow's script code in the response. Default: false.

**Returns:**

`NormalizedFlow`: Returns FLAT flow object with: id, title, description, status, scope, userId, triggerType, cronExpression, timezone, eventFilter, scriptId, scriptInstallationId, scriptInput, scriptInputSchema, executionCount, lastExecutedAt, createdAt, updatedAt, version, feedItemId, isActive, isTimeBased, isEventBased. No nested trigger object. When includeScript=true, also includes scriptCode.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"getFlow","params":{"id":"<ID>"}}' | jq .
```

### `updateFlow`

Update an existing flow. Returns normalized flat structure.

**Arguments:**

- `id` (string, **required**): Flow ID to update (24-character hex string returned by createFlow/createEventFlow)
- `title` (string, *optional*): New title
- `description` (string, *optional*): New description
- `trigger` (object, *optional*): New trigger configuration
- `scriptId` (string, *optional*): New script ID
- `scriptInput` (object, *optional*): New static input data for the script. Fields are spread into event.data in handler code.
- `scriptInputSchema` (object, *optional*): Schema describing scriptInput fields. Keys are field names, values are { type, required?, description? }.
- `status` (string, *optional*): New status: active, paused, completed, failed
- `parentSpaceId` (string, *optional*): Group/space ID to scope this flow to. When set, the flow executes with group context and accesses the group's data instead of the user's personal data. Set to empty string to remove group scope.
- `schedule` (string, *optional*): Cron expression for time-based flows. Times are automatically evaluated in the user's local timezone. Example: "0 9 * * *" runs at 9am in the user's timezone.
- `eventType` (string, *optional*): Event type shorthand (e.g., "telegram.message"). Use ONLY when you need to process every single event of this type. For filtering a subset of events, use eventFilter instead.
- `eventFilter` (object, *optional*): Event filter with operator and conditions array. RECOMMENDED for most event flows — lets you pre-filter events before Lambda invocation (free, in-memory). Example: { operator: "and", conditions: [{ operator: "equals", field: "type", value: "telegram.message" }, { operator: "startsWith", field: "content.text", value: "/" }] }

**Returns:**

`NormalizedFlow`: Returns FLAT flow object with: id, title, description, status, scope, userId, parentSpaceId, triggerType, cronExpression, timezone, eventFilter, scriptId, scriptInstallationId, scriptInput, scriptInputSchema, executionCount, lastExecutedAt, createdAt, updatedAt, version, feedItemId, isActive, isTimeBased, isEventBased. No nested trigger object.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"updateFlow","params":{"id":"<ID>"}}' | jq .
```

### `modifyFlowScript`

Replace the ENTIRE script code for a flow. For small changes, prefer editFlowScript instead — it only requires the changed portions. Use modifyFlowScript only when rewriting more than ~50% of the code or creating a script from scratch.

**Arguments:**

- `flowId` (string, **required**): Flow ID to modify (24-character hex string)
- `newCode` (string, **required**): New handler code. Must include export async function handler(event, context, mirra) wrapper.
- `commitMessage` (string, *optional*): Description of changes (optional)

**Returns:**

`object`: Returns: { copied (boolean - true if a private copy was created), scriptId, versionId, version }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"modifyFlowScript","params":{"flowId":"507f1f77bcf86cd799439011","newCode":"export async function handler(event, context, mirra) { /* modified */ }","commitMessage":"Filter by current user only"}}' | jq .
```

**Example response:**

```json
{
  "copied": true,
  "scriptId": "507f1f77bcf86cd799439015",
  "versionId": "507f1f77bcf86cd799439016",
  "version": 1
}
```

### `readFlowScript`

Read the script code for a flow with line numbers. Supports optional line range to read a portion of the script. Use this before editFlowScript to see the current code.

**Arguments:**

- `flowId` (string, **required**): Flow ID (24-character hex string)
- `startLine` (number, *optional*): First line to return (1-indexed). Default: 1
- `endLine` (number, *optional*): Last line to return (inclusive). Default: end of file

**Returns:**

`object`: Returns: { scriptId, version, totalLines, startLine, endLine, code (with line numbers) }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"readFlowScript","params":{"flowId":"507f1f77bcf86cd799439011"}}' | jq .
```

**Example response:**

```json
{
  "scriptId": "507f1f77bcf86cd799439012",
  "version": 2,
  "totalLines": 25,
  "startLine": 1,
  "endLine": 25,
  "code": " 1\texport async function handler(event, context, mirra) {\n 2\t  const data = event.data;\n..."
}
```

### `editFlowScript`

Apply surgical edits to a flow's script code using oldText/newText pairs. Each edit replaces an exact text match. Much more efficient than modifyFlowScript for small changes — avoids rewriting the entire script. Use readFlowScript first to see current code.

**Arguments:**

- `flowId` (string, **required**): Flow ID (24-character hex string)
- `edits` (array, **required**): Array of edits. Each: { oldText: string (exact match in current code), newText: string (replacement) }. Applied sequentially. oldText must be unique in the code — include enough surrounding context.
- `commitMessage` (string, *optional*): Description of changes

**Returns:**

`object`: Returns: { copied, scriptId, versionId, version, linesChanged }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"editFlowScript","params":{"flowId":"507f1f77bcf86cd799439011","edits":[{"oldText":"  const data = event.data.payload;","newText":"  const data = event.data.payload;\n  if (!data) return { success: false, noOp: true, reason: 'No payload' };"}],"commitMessage":"Add null check for payload"}}' | jq .
```

**Example response:**

```json
{
  "copied": false,
  "scriptId": "507f1f77bcf86cd799439012",
  "versionId": "507f1f77bcf86cd799439016",
  "version": 3,
  "linesChanged": 2
}
```

### `executeFlow`

Execute a flow on-demand with custom input. The input object is merged into the flow's scriptInput and passed to the handler as event.data fields. Returns the handler's return value along with execution metadata.

**Arguments:**

- `flowId` (string, **required**): Flow ID to execute (24-character hex string)
- `input` (object, *optional*): Dynamic input object passed to the flow handler via event.data. Fields are merged with the flow's static scriptInput (dynamic input takes precedence).

**Returns:**

`FlowExecutionResult`: Returns { success, result (handler return value), error, duration, executionId }

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"executeFlow","params":{"flowId":"507f1f77bcf86cd799439011","input":{"question":"How do I get started?","productId":"product_123"}}}' | jq .
```

**Example response:**

```json
{
  "success": true,
  "executionId": "exec_abc123",
  "duration": 2340,
  "result": {
    "response": "To get started...",
    "sources": []
  }
}
```

### `deleteFlow`

Delete a flow

**Arguments:**

- `id` (string, **required**): Flow ID to delete (24-character hex string returned by createFlow/createEventFlow)

**Returns:**

`DeleteFlowResult`: Returns { flowId, deleted: true }. Simple confirmation with no nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"deleteFlow","params":{"id":"<ID>"}}' | jq .
```

### `pauseFlow`

Pause an active flow. Returns normalized flat structure.

**Arguments:**

- `id` (string, **required**): Flow ID to pause (24-character hex string)

**Returns:**

`NormalizedFlow`: Returns FLAT flow object with status set to "paused". Fields: id, title, description, status, scope, userId, triggerType, cronExpression, timezone, eventFilter, scriptId, etc. No nested trigger object.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"pauseFlow","params":{"id":"<ID>"}}' | jq .
```

### `resumeFlow`

Resume a paused flow. Returns normalized flat structure.

**Arguments:**

- `id` (string, **required**): Flow ID to resume (24-character hex string)

**Returns:**

`NormalizedFlow`: Returns FLAT flow object with status set to "active". Fields: id, title, description, status, scope, userId, triggerType, cronExpression, timezone, eventFilter, scriptId, etc. No nested trigger object.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"resumeFlow","params":{"id":"<ID>"}}' | jq .
```

### `searchFlows`

Search flows with filters. Default returns minimal info (id, title, status, triggerType, isActive). Use detail: "summary" for execution stats. Use getFlow for full details on a specific flow.

**Arguments:**

- `status` (string, *optional*): Filter by status (or array of statuses)
- `triggerType` (string, *optional*): Filter by trigger type: time or event
- `parentSpaceId` (string, *optional*): Filter flows by space/group ID. Only returns flows assigned to this space.
- `detail` (string, *optional*): Detail level: "minimal" (default) returns id, title, status, triggerType, isActive. "summary" adds description, cronExpression, scriptId, executionCount, lastExecutedAt, createdAt.
- `limit` (number, *optional*): Maximum number of results (default: 20)
- `offset` (number, *optional*): Pagination offset (default: 0)

**Returns:**

`FlowSearchResult`: Returns { count: number, flows: FlowListItem[] }. This is an OBJECT, not an array. Always use `result.flows` to access the array and `result.count` for the total. Do NOT use `result.length` or `Array.isArray(result)`. Default minimal fields per flow: id, title, status, triggerType, isActive. With detail: "summary": adds description, userId, cronExpression, scriptId, executionCount, lastExecutedAt, createdAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"searchFlows","params":{}}' | jq .
```

### `recordExecution`

Record execution result for a flow. Returns normalized flat structure.

**Arguments:**

- `id` (string, **required**): Flow ID
- `success` (boolean, **required**): Whether execution succeeded
- `result` (object, *optional*): Execution result data
- `error` (string, *optional*): Error message if execution failed

**Returns:**

`NormalizedFlow`: Returns FLAT flow object with updated executionCount. Fields: id, title, description, status, scope, userId, triggerType, cronExpression, timezone, eventFilter, scriptId, executionCount, lastExecutedAt, etc. No nested trigger object.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"recordExecution","params":{"id":"<ID>","success":true}}' | jq .
```

### `listEventTypes`

List available event types that can trigger automations. Returns normalized event types. Filter by source or sources to narrow results (e.g., source: "telegram" or sources: ["telegram", "gmail"]).

**Arguments:**

- `source` (string, *optional*): Filter by source/category (e.g., "telegram", "gmail", "calendar"). Returns only event types from this source.
- `sources` (array, *optional*): Array of sources to filter by (e.g., ["telegram", "gmail"]). More efficient than separate calls.
- `includeTemplates` (boolean, *optional*): Include condition templates for each event type
- `includeSchema` (boolean, *optional*): Include field schema showing available paths for script access. RECOMMENDED when writing scripts to see correct field access patterns.

**Returns:**

`EventTypeListResult`: Returns { count, eventTypes[] }. Each event type has FLAT fields: constant, eventType, source, description, hasTemplates. When includeSchema=true, also includes fields[], accessExample, and commonMistakes. Filter by source or sources to narrow results.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"listEventTypes","params":{}}' | jq .
```

### `testFlow`

Test a flow by generating an event that matches the trigger conditions.

**Arguments:**

- `flowId` (string, **required**): ID of the flow to test
- `dryRun` (boolean, *optional*): If true (default), only validate trigger matching without executing script. If false, execute the script (causes side effects).
- `eventOverrides` (object, *optional*): Custom field values to merge into the generated test event (e.g., {"content.text": "custom message"})

**Returns:**

`FlowTestResult`: Returns FLAT test result with: success, flowId, mode, triggerMatched, conditionResults[] (each with field, operator, expected, actual, passed), testEvent (id, type, source, summary), executionId, executionStatus, executionDuration, executionError, tokensConsumed, recommendations[]. No nested triggerValidation or execution objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"testFlow","params":{"flowId":"<ID>"}}' | jq .
```

### `validateTrigger`

Check if a custom event would match a flow trigger without any execution. Useful for debugging trigger conditions or testing with real event data.

**Arguments:**

- `flowId` (string, **required**): ID of the flow
- `event` (object, **required**): Event object to test against the trigger (must match IntegrationEvent structure)

**Returns:**

`TriggerValidationResult`: Returns FLAT result with: flowId, matched (boolean), conditionResults[] (each with field, operator, expected, actual, passed). No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"validateTrigger","params":{"flowId":"<ID>","event":{}}}' | jq .
```

### `getFlowsByEventType`

Get all active flows triggered by a specific event type. Default returns minimal info (id, title, status, triggerType, isActive). Use detail: "summary" for execution stats.

**Arguments:**

- `eventType` (string, **required**): Event type to filter by (e.g., "call.action", "call.ended", "telegram.message")
- `detail` (string, *optional*): Detail level: "minimal" (default) returns id, title, status, triggerType, isActive. "summary" adds description, cronExpression, scriptId, executionCount, lastExecutedAt, createdAt.

**Returns:**

`FlowsByEventTypeResult`: Returns { eventType: string, count: number, flows: FlowListItem[] }. This is an OBJECT, not an array. Always use `result.flows` to access the array. Do NOT use `result.length`.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"getFlowsByEventType","params":{"eventType":"<value>"}}' | jq .
```

### `createBatchOperation`

Create a self-managing flow that processes multiple adapter operations over time, respecting rate limits. The flow automatically cleans up when complete and notifies the user via feed item.

**Arguments:**

- `title` (string, **required**): Human-readable title for this batch operation (e.g., "Leave 100 Telegram groups")
- `operations` (array, **required**): Array of operations to execute. Each item must have adapter, operation, and args properties.
- `batchSize` (number, *optional*): Number of operations to process per execution (default: 5)
- `intervalSeconds` (number, *optional*): Seconds between batch executions (default: 60, minimum: 60)

**Returns:**

`BatchOperationResult`: Returns FLAT result with: flowId, title, operationCount, batchSize, intervalSeconds, estimatedCompletionMinutes, message, createdAt. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"createBatchOperation","params":{"title":"Leave old Telegram groups","operations":[{"adapter":"telegram","operation":"leaveGroup","args":{"groupId":"-100123"}},{"adapter":"telegram","operation":"leaveGroup","args":{"groupId":"-100456"}}],"batchSize":5,"intervalSeconds":60}}' | jq .
```

### `publishFlow`

Publish a flow to the marketplace so other users can discover and install it. The flow must have a deployed script.

**Arguments:**

- `flowId` (string, **required**): ID of the flow to publish
- `pricing` (object, *optional*): Pricing configuration. Defaults to { model: "free" }. Supported models: "free", "pay-per-execution". For paid models, include basePrice.
- `tags` (array, *optional*): Tags for marketplace discovery (e.g., ["telegram", "automation"])
- `category` (string, *optional*): Marketplace category (e.g., "messaging", "productivity"). Defaults to "uncategorized".

**Returns:**

`PublishFlowResult`: Returns FLAT result with: flowId, isPublished, status, publishedAt, pricing, category, tags. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"publishFlow","params":{"flowId":"507f1f77bcf86cd799439011","tags":["telegram","notifications"],"category":"messaging"}}' | jq .
```

### `unpublishFlow`

Remove a flow from the marketplace. Existing installations will continue to work.

**Arguments:**

- `flowId` (string, **required**): ID of the flow to unpublish

**Returns:**

`UnpublishFlowResult`: Returns FLAT result with: flowId, isPublished (false), status (archived). No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"flows","method":"unpublishFlow","params":{"flowId":"<ID>"}}' | jq .
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
