---
name: mirra-telegramBot
description: "Use Mirra to send and receive messages through telegram bots. note: bot setup (creating a bot via botfather and adding the token) must be done by the user in the resource.... Covers all Telegram Bot SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Telegram Bot

Send and receive messages through Telegram bots. NOTE: Bot setup (creating a bot via BotFather and adding the token) must be done by the user in the Resources tab — you cannot configure or register bots on their behalf.

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Telegram Bot requires OAuth authentication. The user must have connected their Telegram Bot account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `sendMessage` | Send a text message to a Telegram chat via bot |
| `replyToMessage` | Reply to a specific message in a Telegram chat |
| `answerCallbackQuery` | Respond to an inline keyboard button press (callback query) |
| `sendMessageWithButtons` | Send a message with inline keyboard buttons for user interaction |
| `setBotCommands` | Set the list of commands shown in the bot menu |
| `getBotInfo` | Get information about the bot (username, name, can_join_groups, etc.) |
| `listBots` | List all Telegram bots registered by the user |
| `banChatMember` | Ban or kick a user from a group chat. The bot must be an admin with "Ban Users" permission. Accep... |
| `unbanChatMember` | Unban a previously banned user in a group chat. The bot must be an admin with "Ban Users" permiss... |
| `restrictChatMember` | Restrict a user's permissions in a group chat (mute, block media, etc.). The bot must be an admin... |
| `getChatMember` | Look up a user in a group chat by their user ID or @username. Returns their membership status (cr... |
| `deleteMessage` | Delete a message in a group chat. The bot must be an admin with "Delete Messages" permission, or ... |

## Operation Details

### `sendMessage`

Send a text message to a Telegram chat via bot

**Arguments:**

- `botUsername` (string, **required**): Username of the bot to send from (without @)
- `chatId` (string, **required**): Telegram chat ID to send the message to
- `text` (string, **required**): Message text to send (supports Markdown)
- `parseMode` (string, *optional*): Parse mode: Markdown, MarkdownV2, or HTML
- `disableNotification` (boolean, *optional*): Send silently without notification sound

**Returns:**

`AdapterOperationResult`: Sent message details including messageId and chatId

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/sendMessage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"my_bot","chatId":"123456789","text":"Hello from Mirra!"}' | jq .
```

**Example response:**

```json
{
  "messageId": 42,
  "chatId": "123456789",
  "text": "Hello from Mirra!"
}
```

### `replyToMessage`

Reply to a specific message in a Telegram chat

**Arguments:**

- `botUsername` (string, **required**): Username of the bot to reply from (without @)
- `chatId` (string, **required**): Telegram chat ID
- `text` (string, **required**): Reply text (supports Markdown)
- `replyToMessageId` (number, **required**): Message ID to reply to
- `parseMode` (string, *optional*): Parse mode: Markdown, MarkdownV2, or HTML

**Returns:**

`AdapterOperationResult`: Sent reply details including messageId

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/replyToMessage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"my_bot","chatId":"123456789","text":"Got it!","replyToMessageId":41}' | jq .
```

**Example response:**

```json
{
  "messageId": 43,
  "chatId": "123456789",
  "text": "Got it!",
  "replyToMessageId": 41
}
```

### `answerCallbackQuery`

Respond to an inline keyboard button press (callback query)

**Arguments:**

- `botUsername` (string, **required**): Username of the bot
- `callbackQueryId` (string, **required**): Callback query ID from the button press event
- `text` (string, *optional*): Optional text to show as a notification to the user
- `showAlert` (boolean, *optional*): If true, show an alert instead of a toast notification

**Returns:**

`AdapterOperationResult`: Confirmation of callback query answer

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/answerCallbackQuery" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"<value>","callbackQueryId":"<ID>"}' | jq .
```

### `sendMessageWithButtons`

Send a message with inline keyboard buttons for user interaction

**Arguments:**

- `botUsername` (string, **required**): Username of the bot to send from (without @)
- `chatId` (string, **required**): Telegram chat ID
- `text` (string, **required**): Message text (supports Markdown)
- `buttons` (array, **required**): Array of button rows. Each row is an array of { text, callbackData } objects
- `parseMode` (string, *optional*): Parse mode: Markdown, MarkdownV2, or HTML

**Returns:**

`AdapterOperationResult`: Sent message details with button layout

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/sendMessageWithButtons" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"my_bot","chatId":"123456789","text":"Do you approve?","buttons":[[{"text":"Yes","callbackData":"approve_yes"},{"text":"No","callbackData":"approve_no"}]]}' | jq .
```

**Example response:**

```json
{
  "messageId": 44,
  "chatId": "123456789",
  "text": "Do you approve?",
  "hasButtons": true
}
```

### `setBotCommands`

Set the list of commands shown in the bot menu

**Arguments:**

- `botUsername` (string, **required**): Username of the bot
- `commands` (array, **required**): Array of { command, description } objects

**Returns:**

`AdapterOperationResult`: Confirmation of commands being set

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/setBotCommands" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"<value>","commands":[]}' | jq .
```

### `getBotInfo`

Get information about the bot (username, name, can_join_groups, etc.)

**Arguments:**

- `botUsername` (string, **required**): Username of the bot

**Returns:**

`AdapterOperationResult`: Bot information including id, username, name, and capabilities

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/getBotInfo" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"<value>"}' | jq .
```

### `listBots`

List all Telegram bots registered by the user

**Returns:**

`AdapterOperationResult`: Array of registered bots with their usernames and status

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/listBots" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `banChatMember`

Ban or kick a user from a group chat. The bot must be an admin with "Ban Users" permission. Accepts a numeric user ID or @username. To kick (remove without permanent ban), set untilDate to ~30 seconds in the future — e.g. Math.floor(Date.now()/1000) + 30.

**Arguments:**

- `botUsername` (string, **required**): Username of the bot (without @)
- `chatId` (string, **required**): Group chat ID
- `userId` (string, **required**): Telegram user ID or @username to ban. Examples: "123456", "@johndoe"
- `untilDate` (number, *optional*): Unix timestamp for temporary ban. Set to ~30s in the future for a "kick" (remove without permanent ban). Omit for permanent ban.
- `revokeMessages` (boolean, *optional*): If true, delete all messages from this user in the group

**Returns:**

`AdapterOperationResult`: Confirmation of the ban action

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/banChatMember" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"my_bot","chatId":"-1001234567890","userId":123456,"untilDate":1700000030}' | jq .
```

**Example response:**

```json
{
  "userId": 123456,
  "chatId": "-1001234567890",
  "banned": true,
  "untilDate": 1700000030
}
```

### `unbanChatMember`

Unban a previously banned user in a group chat. The bot must be an admin with "Ban Users" permission. Accepts a numeric user ID or @username.

**Arguments:**

- `botUsername` (string, **required**): Username of the bot (without @)
- `chatId` (string, **required**): Group chat ID
- `userId` (string, **required**): Telegram user ID or @username to unban. Examples: "123456", "@johndoe"
- `onlyIfBanned` (boolean, *optional*): If true, only unban if the user is actually banned (will not re-add a user who left voluntarily)

**Returns:**

`AdapterOperationResult`: Confirmation of the unban action

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/unbanChatMember" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"my_bot","chatId":"-1001234567890","userId":123456,"onlyIfBanned":true}' | jq .
```

**Example response:**

```json
{
  "userId": 123456,
  "chatId": "-1001234567890",
  "unbanned": true
}
```

### `restrictChatMember`

Restrict a user's permissions in a group chat (mute, block media, etc.). The bot must be an admin with "Ban Users" permission. Accepts a numeric user ID or @username. Pass a permissions object to control what the user can do.

**Arguments:**

- `botUsername` (string, **required**): Username of the bot (without @)
- `chatId` (string, **required**): Group chat ID
- `userId` (string, **required**): Telegram user ID or @username to restrict. Examples: "123456", "@johndoe"
- `permissions` (object, **required**): ChatPermissions object with boolean fields: canSendMessages, canSendPhotos, canSendVideos, canSendAudios, canSendDocuments, canSendVoiceNotes, canSendVideoNotes, canSendPolls, canSendOtherMessages, canAddWebPagePreviews, canChangeInfo, canInviteUsers, canPinMessages, canManageTopics. Set to false to restrict.
- `untilDate` (number, *optional*): Unix timestamp for temporary restriction. Omit for permanent restriction.

**Returns:**

`AdapterOperationResult`: Confirmation of the restriction

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/restrictChatMember" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"my_bot","chatId":"-1001234567890","userId":123456,"permissions":{"canSendMessages":false},"untilDate":1700003600}' | jq .
```

**Example response:**

```json
{
  "userId": 123456,
  "chatId": "-1001234567890",
  "restricted": true,
  "permissions": {
    "canSendMessages": false
  },
  "untilDate": 1700003600
}
```

### `getChatMember`

Look up a user in a group chat by their user ID or @username. Returns their membership status (creator, administrator, member, restricted, left, kicked) and permissions.

**Arguments:**

- `botUsername` (string, **required**): Username of the bot (without @)
- `chatId` (string, **required**): Group chat ID
- `userId` (string, **required**): Telegram user ID or @username to look up. Examples: "123456", "@johndoe"

**Returns:**

`AdapterOperationResult`: User membership info including status, name, and permissions

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/getChatMember" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"my_bot","chatId":"-1001234567890","userId":123456}' | jq .
```

**Example response:**

```json
{
  "userId": 123456,
  "status": "member",
  "firstName": "John",
  "username": "johndoe"
}
```

### `deleteMessage`

Delete a message in a group chat. The bot must be an admin with "Delete Messages" permission, or the message must have been sent by the bot itself.

**Arguments:**

- `botUsername` (string, **required**): Username of the bot (without @)
- `chatId` (string, **required**): Group chat ID
- `messageId` (number, **required**): ID of the message to delete

**Returns:**

`AdapterOperationResult`: Confirmation of message deletion

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/telegramBot/deleteMessage" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"botUsername":"my_bot","chatId":"-1001234567890","messageId":999}' | jq .
```

**Example response:**

```json
{
  "messageId": 999,
  "chatId": "-1001234567890",
  "deleted": true
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
