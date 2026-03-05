---
name: mirra-twitter
description: "Use Mirra to twitter (x) posting and social media management. Covers all Twitter SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Twitter

Twitter (X) posting and social media management

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Twitter requires OAuth authentication. The user must have connected their Twitter account in the Mirra app before these operations will work.

## API Call Pattern

All operations use POST requests to the Mirra SDK API:

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/twitter/{operation}" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{ ...args }' | jq .
```

Replace `{operation}` with the operation name from the table below.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `postTweet` | Post a tweet |
| `getUserTweets` | Retrieve tweets from a Twitter user. Must provide either userId OR userName (not both). NOTE: Thi... |
| `advancedSearch` | Search tweets using advanced Twitter search syntax. Supports operators like from:username, since:... |
| `getTweetById` | Fetch one or more tweets by their IDs. Useful for retrieving parent/original tweets when processi... |

## Operation Details

### `postTweet`

Post a tweet

**Arguments:**

- `text` (string, **required**): Tweet text (max 280 characters)

**Returns:**

`AdapterOperationResult`: Returns { tweetId: string, text: string } in result.data

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/twitter/postTweet" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"text":"<value>"}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `getUserTweets`

Retrieve tweets from a Twitter user. Must provide either userId OR userName (not both). NOTE: This operation ONLY accepts the 4 parameters listed below. There is NO maxResults, limit, count, or similar parameters - the API returns ~20 tweets per page, use cursor for pagination.

**Arguments:**

- `userId` (string, *optional*): Twitter user ID (recommended for stability and speed). Provide userId OR userName, not both.
- `userName` (string, *optional*): Twitter username/handle without @ symbol (e.g., "elonmusk"). Provide userName OR userId, not both.
- `cursor` (string, *optional*): Pagination cursor from previous response's nextCursor field. Do not fabricate cursor values.
- `includeReplies` (boolean, *optional*): Whether to include replies in results. Defaults to false (only original tweets).

**Returns:**

`AdapterOperationResult`: Returns normalized flat structure: { tweets: NormalizedTweet[], hasNextPage, nextCursor, totalRetrieved }. Each tweet has FLAT fields (no nested author object): id, text, url, createdAt, lang, likeCount, retweetCount, replyCount, quoteCount, viewCount, bookmarkCount, isReply, isRetweet, inReplyToTweetId, conversationId, source, authorId, authorName, authorUserName, authorFollowers, authorFollowing, authorIsVerified, authorVerifiedType, authorCreatedAt. For replies: inReplyToTweetId contains the parent tweet ID, conversationId contains the thread root tweet ID.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/twitter/getUserTweets" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{}' | jq .
```

### `advancedSearch`

Search tweets using advanced Twitter search syntax. Supports operators like from:username, since:date, until:date, lang:en, and boolean operators (AND, OR). NOTE: This operation ONLY accepts the 3 parameters listed below (query, queryType, cursor). There is NO minFollowers, maxResults, limit, or other filtering parameters - filter results client-side after fetching.

**Arguments:**

- `query` (string, **required**): Search query with advanced syntax. Examples: "from:elonmusk", "bitcoin since:2024-01-01", "AI OR \"machine learning\"". Supported operators: from:user, to:user, since:YYYY-MM-DD, until:YYYY-MM-DD, lang:xx, filter:media, filter:links, -filter:retweets, AND, OR, -keyword, "exact phrase".
- `queryType` (string, *optional*): Type of search results: "Latest" (most recent) or "Top" (most relevant). Defaults to "Latest". Only these two values are valid.
- `cursor` (string, *optional*): Pagination cursor from previous response's nextCursor field. Do not fabricate cursor values.

**Returns:**

`AdapterOperationResult`: Returns normalized flat structure: { query, queryType, tweets: NormalizedTweet[], hasNextPage, nextCursor, totalRetrieved }. Each tweet has FLAT fields (no nested author object): id, text, url, createdAt, lang, likeCount, retweetCount, replyCount, quoteCount, viewCount, bookmarkCount, isReply, isRetweet, inReplyToTweetId, conversationId, source, authorId, authorName, authorUserName, authorFollowers, authorFollowing, authorIsVerified, authorVerifiedType, authorCreatedAt. For replies: inReplyToTweetId contains the parent tweet ID, conversationId contains the thread root tweet ID. To filter by follower count, check tweet.authorFollowers >= threshold.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/twitter/advancedSearch" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"query":"search term"}' | jq .
```

### `getTweetById`

Fetch one or more tweets by their IDs. Useful for retrieving parent/original tweets when processing replies. Accepts a single ID or comma-separated list of IDs (max 100).

**Arguments:**

- `tweetIds` (string, **required**): One or more tweet IDs, comma-separated. Example: "1846987139428634858" or "1846987139428634858,1866332309399781537"

**Returns:**

`AdapterOperationResult`: Returns normalized flat structure: { tweets: NormalizedTweet[], totalRetrieved }. Each tweet has the same FLAT fields as advancedSearch results: id, text, url, createdAt, lang, likeCount, retweetCount, replyCount, quoteCount, viewCount, bookmarkCount, isReply, isRetweet, inReplyToTweetId, conversationId, source, authorId, authorName, authorUserName, authorFollowers, authorFollowing, authorIsVerified, authorVerifiedType, authorCreatedAt.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v1/twitter/getTweetById" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"tweetIds":"<ID>"}' | jq .
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
