---
name: mirra-ai
description: "Use Mirra to access ai services for chat, decisions, and streaming with multi-provider support. Covers all AI Services SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra AI Services

Access AI services for chat, decisions, and streaming with multi-provider support

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
    "resourceId": "ai",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/ai/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `chat` | Have a conversation with an AI assistant. Supports multi-turn conversations with system prompts, ... |
| `decide` | Use AI to make a decision from a list of options. The AI analyzes your prompt, considers the cont... |
| `agent` | Run an AI agent that can call tools across multiple rounds. The agent receives a conversation, de... |
| `computerUse` | Proxy for the Anthropic Computer Use API. Forwards requests to Anthropic's Messages API with comp... |

## Operation Details

### `chat`

Have a conversation with an AI assistant. Supports multi-turn conversations with system prompts, user messages, and assistant responses.

**Arguments:**

- `message` (string, *optional*): Simple string shorthand for single-turn queries. Auto-wrapped into messages array. Use "messages" for multi-turn conversations.
- `messages` (array, *optional*): Array of message objects with role ("system" | "user" | "assistant") and content (string or content blocks array). For images, use content: [{ type: "text", text: "..." }, { type: "image", source: { type: "base64", media_type: "image/png", data: "<base64>" } }]
- `model` (string, *optional*): Specific model to use. Default: "claude-3-haiku-20240307". Use Anthropic Claude model names.
- `temperature` (number, *optional*): Creativity level 0.0-1.0. Lower=factual/consistent, Higher=creative/varied. Default: 0.7
- `maxTokens` (number, *optional*): Maximum tokens in response. Default: 1000. Increase for longer responses (costs more tokens).

**Returns:**

`NormalizedChatResponse`: Returns FLAT structure with: content (AI response text), model (model used), inputTokens, outputTokens, totalTokens. No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"ai","method":"chat","params":{"message":"What is the capital of France?"}}' | jq .
```

### `decide`

Use AI to make a decision from a list of options. The AI analyzes your prompt, considers the context, and selects the most appropriate option with reasoning.

**Arguments:**

- `prompt` (string, **required**): The decision prompt - what needs to be decided and why
- `options` (array, **required**): Array of options to choose from. Each option must have: id (unique identifier), label (descriptive name), and optional metadata (additional data)
- `context` (string, *optional*): Additional context to help the AI make a better decision
- `model` (string, *optional*): Specific model to use. Defaults to system default.

**Returns:**

`NormalizedDecideResponse`: Returns FLAT structure with: selectedOption (chosen option ID), reasoning (explanation of why chosen). No nested objects.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"ai","method":"decide","params":{"prompt":"User sent message: \"I need to schedule a meeting next Tuesday\"","options":[{"id":"calendar","label":"Calendar/Scheduling"},{"id":"email","label":"Email Management"},{"id":"tasks","label":"Task Management"},{"id":"general","label":"General Query"}]}}' | jq .
```

### `agent`

Run an AI agent that can call tools across multiple rounds. The agent receives a conversation, decides which tools to use, executes them, and continues until the task is complete or max rounds are reached.

**Arguments:**

- `messages` (array, **required**): Conversation messages array with role and content
- `tools` (array, *optional*): Adapter names to give the agent access to. Omit for all adapters.
- `systemPrompt` (string, *optional*): System prompt to guide agent behavior
- `model` (string, *optional*): Model to use. Default: claude-sonnet-4-20250514
- `temperature` (number, *optional*): Temperature 0.0-1.0. Default: 0.5
- `maxTokens` (number, *optional*): Max tokens per LLM call. Default: 4096
- `maxRounds` (number, *optional*): Max tool-calling rounds. Default: 10, max: 25

**Returns:**

`AgentResponse`: Final text, token usage, round count, and full tool call history

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"ai","method":"agent","params":{"messages":[{"role":"user","content":"Find my meetings tomorrow and summarize them"}],"tools":["googleCalendar","memory"]}}' | jq .
```

### `computerUse`

Proxy for the Anthropic Computer Use API. Forwards requests to Anthropic's Messages API with computer use beta headers and returns the raw response. You handle the tool execution loop (screenshots, clicks, typing) on your side — Mirra handles auth and billing.

**Arguments:**

- `messages` (array, **required**): Anthropic-format messages array. Include tool_result blocks with base64 screenshots when responding to tool_use requests.
- `tools` (array, *optional*): Anthropic computer use tool definitions. Defaults to computer tool with 1024x768 display if omitted.
- `model` (string, *optional*): Model to use. Default: claude-sonnet-4-6. Only Sonnet models are supported.
- `maxTokens` (number, *optional*): Maximum tokens in response. Default: 4096.
- `system` (string, *optional*): System prompt to guide computer use behavior.
- `temperature` (number, *optional*): Temperature 0.0-1.0. Default: 1.0 (Anthropic recommended for computer use).

**Returns:**

`ComputerUseResponse`: Raw Anthropic response with content blocks (text + tool_use), token usage, and tokensCharged (after 6x multiplier).

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"ai","method":"computerUse","params":{"messages":[{"role":"user","content":"Open the browser and navigate to example.com"}],"tools":[{"type":"computer_20251124","name":"computer","display_width_px":1024,"display_height_px":768}]}}' | jq .
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
