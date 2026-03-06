---
name: mirra-feedback
description: "Use Mirra to internal feedback and bug reporting system for beta usage. Covers all Feedback SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Feedback

Internal feedback and bug reporting system for beta usage

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
    "resourceId": "feedback",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/feedback/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `reportBug` | Report a bug with detailed context and reproduction steps |
| `reportToolFailure` | Auto-report tool or adapter failures for debugging |
| `reportMissingCapability` | Report when LLM cannot fulfill a user request |
| `submitFeedback` | Submit general user feedback |
| `submitFeatureRequest` | Submit a feature request |

## Operation Details

### `reportBug`

Report a bug with detailed context and reproduction steps

**Arguments:**

- `title` (string, **required**): Brief bug description
- `description` (string, **required**): Detailed description of the bug
- `severity` (string, **required**): Bug severity: critical, high, medium, or low
- `stepsToReproduce` (array, *optional*): Steps to reproduce the bug
- `expectedBehavior` (string, *optional*): What should happen
- `actualBehavior` (string, *optional*): What actually happens
- `errorDetails` (object, *optional*): Error details: { message, stack, code }
- `context` (object, *optional*): Additional context: { conversationId, recentMessages, platform, appVersion }
- `llmAnalysis` (string, *optional*): LLM analysis of the issue

**Returns:**

`AdapterOperationResult`: Normalized result with id, type, title, severity, createdAt, source

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"feedback","method":"reportBug","params":{"title":"App crashes on startup","description":"The app crashes immediately after login on iOS devices","severity":"critical","stepsToReproduce":["Open app","Enter credentials","Tap login"],"expectedBehavior":"Navigate to home screen","actualBehavior":"App crashes with no error message"}}' | jq .
```

**Example response:**

```json
{
  "id": "bug_abc123",
  "type": "bug",
  "title": "App crashes on startup",
  "severity": "critical",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "source": "user_submitted"
}
```

### `reportToolFailure`

Auto-report tool or adapter failures for debugging

**Arguments:**

- `adapterType` (string, **required**): Adapter type (e.g., jupiter, crypto)
- `operation` (string, **required**): Operation that failed (e.g., swap, sendToken)
- `errorMessage` (string, **required**): Error message from the failure
- `errorCode` (string, *optional*): Error code if available
- `errorStack` (string, *optional*): Error stack trace
- `args` (object, *optional*): Sanitized arguments that caused the failure
- `llmAnalysis` (string, *optional*): LLM analysis of why it failed
- `suggestedFix` (string, *optional*): LLM suggested fix
- `context` (object, *optional*): Additional context: { conversationId, userId, timestamp }

**Returns:**

`AdapterOperationResult`: Normalized result with id, type, adapterType, operation, errorMessage, createdAt, source

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"feedback","method":"reportToolFailure","params":{"adapterType":"jupiter","operation":"swap","errorMessage":"Insufficient funds for swap","errorCode":"INSUFFICIENT_FUNDS"}}' | jq .
```

**Example response:**

```json
{
  "id": "failure_def456",
  "type": "tool_failure",
  "adapterType": "jupiter",
  "operation": "swap",
  "errorMessage": "Insufficient funds for swap",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "source": "llm_auto_report"
}
```

### `reportMissingCapability`

Report when LLM cannot fulfill a user request

**Arguments:**

- `userRequest` (string, **required**): What the user asked for
- `reason` (string, **required**): Why it could not be fulfilled
- `suggestedCapability` (string, *optional*): What capability would enable this
- `relatedAdapters` (array, *optional*): Adapters that might be relevant
- `context` (object, *optional*): Additional context: { conversationId }

**Returns:**

`AdapterOperationResult`: Normalized result with id, type, userRequest, reason, createdAt, source

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"feedback","method":"reportMissingCapability","params":{"userRequest":"Send an email with attachments","reason":"Email adapter does not support attachments yet","suggestedCapability":"Email attachment support"}}' | jq .
```

**Example response:**

```json
{
  "id": "missing_ghi789",
  "type": "missing_capability",
  "userRequest": "Send an email with attachments",
  "reason": "Email adapter does not support attachments yet",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "source": "llm_auto_report"
}
```

### `submitFeedback`

Submit general user feedback

**Arguments:**

- `sentiment` (string, **required**): Sentiment: positive, negative, or neutral
- `feedback` (string, **required**): Feedback content
- `category` (string, *optional*): Category: ux, performance, feature, or general
- `context` (object, *optional*): Additional context: { feature, screen }

**Returns:**

`AdapterOperationResult`: Normalized result with id, type, sentiment, category, createdAt, source

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"feedback","method":"submitFeedback","params":{"sentiment":"positive","feedback":"The new chat interface is much faster and easier to use!","category":"ux"}}' | jq .
```

**Example response:**

```json
{
  "id": "feedback_jkl012",
  "type": "feedback",
  "sentiment": "positive",
  "category": "ux",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "source": "user_submitted"
}
```

### `submitFeatureRequest`

Submit a feature request

**Arguments:**

- `title` (string, **required**): Feature title
- `description` (string, **required**): Feature description
- `useCase` (string, *optional*): Why the user needs this feature
- `priority` (string, *optional*): Priority: high, medium, or low

**Returns:**

`AdapterOperationResult`: Normalized result with id, type, title, priority, createdAt, source

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"feedback","method":"submitFeatureRequest","params":{"title":"Dark mode support","description":"Add a dark mode theme option for the app","useCase":"Better readability at night and reduced eye strain","priority":"medium"}}' | jq .
```

**Example response:**

```json
{
  "id": "feature_mno345",
  "type": "feature_request",
  "title": "Dark mode support",
  "priority": "medium",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "source": "user_submitted"
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
