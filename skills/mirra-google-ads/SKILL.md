---
name: mirra-google-ads
description: "Use Mirra to google ads campaign management, performance analytics, and keyword research. Covers all Google Ads SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Google Ads

Google Ads campaign management, performance analytics, and keyword research

## Prerequisites

You need the user's **API key**. Ask for these if not provided:
- `API_KEY`: Mirra API key (generated in Mirra app > Settings > API Keys)
- `API_URL`: Defaults to `https://api.fxn.world` (only ask if they mention a custom server)

> **Note:** Google Ads requires OAuth authentication. The user must have connected their Google Ads account in the Mirra app before these operations will work.

## API Call Pattern

All operations use a single POST endpoint with the resource ID and method in the body:

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "resourceId": "google-ads",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/googleAds/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `getAccountOverview` | Returns high-level account metrics and a quick snapshot of account health for a given date range.... |
| `listCampaigns` | Lists all non-removed campaigns with their performance metrics for the given date range. Use this... |
| `getCampaignDetails` | Returns detailed metrics for a single campaign, including a day-by-day breakdown for the date ran... |
| `updateCampaignStatus` | Pauses or enables a campaign. Pausing immediately stops all ads in the campaign from serving. Ena... |
| `updateCampaignBudget` | Modifies the daily budget for a campaign's associated budget. Note: if multiple campaigns share a... |
| `listAdGroups` | Lists all ad groups within a campaign with performance metrics. Use this after identifying an und... |
| `getAdGroupDetails` | Detailed metrics for a single ad group with daily breakdown. Use this when an ad group's aggregat... |
| `updateAdGroupStatus` | Pauses or enables an ad group. Pausing stops all ads and keywords within it from serving. Same se... |
| `updateAdGroupBid` | Modifies the default CPC bid for an ad group. This affects all keywords in the ad group that don'... |
| `listKeywords` | Lists all keywords in an ad group (or across a campaign) with performance metrics and quality sco... |
| `getKeywordDetails` | Detailed metrics for a single keyword with daily breakdown. Use this to understand the performanc... |
| `updateKeywordStatus` | Pauses or enables a specific keyword. Use this to stop a specific keyword from spending without t... |
| `getSearchTermReport` | Returns the actual search queries that users typed which triggered your ads. This is the single m... |
| `getKeywordIdeas` | Uses the Google Keyword Planner API to generate keyword ideas from seed keywords or a landing pag... |
| `listAds` | Lists all ads within an ad group with performance metrics and quality signals. For Responsive Sea... |
| `getAdDetails` | Detailed metrics for a single ad with daily breakdown. Most useful for spotting when an ad's CTR ... |
| `getPerformanceReport` | Flexible performance report with custom dimension and metric selection. Use this for custom analy... |
| `getAuctionInsights` | Returns auction insights showing how your ads compete against other advertisers in the same aucti... |
| `getChangeHistory` | Returns a log of changes made to the account within the date range. Essential for diagnosing sudd... |
| `getConversionReport` | Reports on conversion performance broken down by conversion action (e.g., "Purchase", "Lead Form ... |
| `getGeographicReport` | Performance broken down by country, region, or city. Use this to find geographic concentrations o... |
| `getDeviceReport` | Performance broken down by device type (desktop, mobile, tablet). Use this to identify device-spe... |
| `getHourOfDayReport` | Performance segmented by hour of day AND day of week. Use this to identify optimal ad scheduling ... |
| `listBudgets` | Lists all campaign budgets in the account, including shared budgets and how many campaigns are us... |
| `getBudgetRecommendations` | Returns Google's automated budget recommendations for campaigns that are budget-constrained. Goog... |

## Operation Details

### `getAccountOverview`

Returns high-level account metrics and a quick snapshot of account health for a given date range. Use this as the entry point for any account-level analysis — it gives you total spend, overall ROAS/CPA, and surfaces top/bottom campaigns so you know where to drill in. Start here when the user asks something like "how are my ads doing?" or "give me a summary of my Google Ads account."

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID (e.g., '123-456-7890')
- `dateRange` (string, *optional*): Named date range (e.g., LAST_30_DAYS, LAST_7_DAYS, THIS_MONTH) or custom range YYYY-MM-DD:YYYY-MM-DD. Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Account overview with total spend, conversions, ROAS, CPA, and top/bottom campaigns

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getAccountOverview","params":{"customerId":"123-456-7890","dateRange":"LAST_30_DAYS"}}' | jq .
```

**Example response:**

```json
{
  "customerId": "1234567890",
  "accountName": "Acme Corp",
  "currencyCode": "USD",
  "timeZone": "America/Los_Angeles",
  "dateRange": {
    "start": "2026-02-15",
    "end": "2026-03-17"
  },
  "totalCampaigns": 12,
  "activeCampaigns": 8,
  "pausedCampaigns": 4,
  "metrics": {
    "impressions": 450000,
    "clicks": 18200,
    "cost": 9840.5,
    "conversions": 312,
    "conversionsValue": 45600,
    "ctr": 0.0404,
    "avgCpc": 0.54,
    "cpa": 31.54,
    "roas": 4.63
  }
}
```

### `listCampaigns`

Lists all non-removed campaigns with their performance metrics for the given date range. Use this to rank campaigns by ROAS, CPA, spend, or conversion volume and quickly identify which are performing and which are bleeding budget. Returns up to 200 campaigns sorted by spend descending by default. Each campaign includes a metrics object — check roas, cpa, and searchImpressionShare to understand performance gaps.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `dateRange` (string, *optional*): Named range or custom YYYY-MM-DD:YYYY-MM-DD. Default: LAST_30_DAYS
- `status` (string, *optional*): Filter by status: ENABLED, PAUSED, or ALL. Default: ALL
- `limit` (number, *optional*): Max campaigns to return. Default: 200, max: 200
- `orderBy` (string, *optional*): Sort field: cost, conversions, roas, cpa, impressions, clicks. Default: cost

**Returns:**

`AdapterOperationResult`: List of campaigns with performance metrics

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"listCampaigns","params":{"customerId":"123-456-7890","dateRange":"LAST_30_DAYS"}}' | jq .
```

**Example response:**

```json
{
  "type": "campaigns",
  "count": 8,
  "entities": [
    {
      "id": "11111",
      "name": "Brand - Exact",
      "status": "ENABLED",
      "advertisingChannelType": "SEARCH",
      "biddingStrategy": "MAXIMIZE_CONVERSIONS",
      "dailyBudget": 500,
      "metrics": {
        "impressions": 120000,
        "clicks": 9800,
        "cost": 3200,
        "conversions": 198,
        "roas": 8.2,
        "cpa": 16.16,
        "ctr": 0.0817
      }
    }
  ]
}
```

### `getCampaignDetails`

Returns detailed metrics for a single campaign, including a day-by-day breakdown for the date range. Use this after listCampaigns to drill into a specific campaign — check the daily trend to spot when performance changed. The dailyMetrics array shows exactly which days had high CPA or low ROAS, helping attribute changes to external events, bid changes, or budget issues.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, **required**): Campaign ID from listCampaigns
- `dateRange` (string, *optional*): Named range or custom. Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Campaign details with daily metrics breakdown

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getCampaignDetails","params":{"customerId":"<ID>","campaignId":"<ID>"}}' | jq .
```

### `updateCampaignStatus`

Pauses or enables a campaign. Pausing immediately stops all ads in the campaign from serving. Enabling resumes delivery (subject to budget and bid eligibility). Always show the user the campaign name and current budget before confirming. This change is reversible but takes effect within minutes. RISKY — requires explicit user confirmation before calling.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, **required**): Campaign ID to modify
- `status` (string, **required**): New status: PAUSED or ENABLED (not REMOVED)
- `reason` (string, *optional*): Optional reason for the change (stored in adapter audit log, not sent to Google)

**Returns:**

`AdapterOperationResult`: Confirmation with campaignId, campaignName, previousStatus, newStatus, updatedAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"updateCampaignStatus","params":{"customerId":"123-456-7890","campaignId":"22222","status":"PAUSED","reason":"CPA exceeded $100 threshold for 7 days"}}' | jq .
```

**Example response:**

```json
{
  "campaignId": "22222",
  "campaignName": "Non-Brand - Broad",
  "previousStatus": "ENABLED",
  "newStatus": "PAUSED",
  "updatedAt": "2026-03-17T14:30:00Z"
}
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateCampaignBudget`

Modifies the daily budget for a campaign's associated budget. Note: if multiple campaigns share a budget (shared budget), this will affect all of them — the response includes sharedWithCampaigns to warn the user. Always confirm the exact dollar amount and, if shared, which other campaigns will be affected. RISKY — requires explicit user confirmation.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, **required**): Campaign ID (used to look up the associated budget)
- `dailyBudgetAmount` (number, **required**): New daily budget in account currency (e.g., 150.00 for $150/day)

**Returns:**

`AdapterOperationResult`: Confirmation with budgetId, campaignId, campaignName, previousBudget, newBudget, sharedWithCampaigns, updatedAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"updateCampaignBudget","params":{"customerId":"<ID>","campaignId":"<ID>","dailyBudgetAmount":10}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listAdGroups`

Lists all ad groups within a campaign with performance metrics. Use this after identifying an underperforming campaign to understand which ad groups are dragging down the campaign's numbers. An ad group's metrics aggregate all keywords and ads within it. Check defaultCpcBid vs actual avgCpc — a large gap may indicate the auto-bidding is diverging from manual intent.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, **required**): Filter to ad groups within this campaign
- `dateRange` (string, *optional*): Default: LAST_30_DAYS
- `status` (string, *optional*): ENABLED, PAUSED, or ALL. Default: ALL

**Returns:**

`AdapterOperationResult`: List of ad groups with performance metrics

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"listAdGroups","params":{"customerId":"<ID>","campaignId":"<ID>"}}' | jq .
```

### `getAdGroupDetails`

Detailed metrics for a single ad group with daily breakdown. Use this when an ad group's aggregate metrics look problematic — the daily trend will show whether the issue is recent or chronic.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `adGroupId` (string, **required**): Ad group ID
- `dateRange` (string, *optional*): Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Ad group details with daily metrics breakdown

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getAdGroupDetails","params":{"customerId":"<ID>","adGroupId":"<ID>"}}' | jq .
```

### `updateAdGroupStatus`

Pauses or enables an ad group. Pausing stops all ads and keywords within it from serving. Same semantics as updateCampaignStatus but scoped to an ad group. RISKY — requires explicit user confirmation.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `adGroupId` (string, **required**): Ad group ID
- `status` (string, **required**): PAUSED or ENABLED

**Returns:**

`AdapterOperationResult`: Confirmation with adGroupId, adGroupName, campaignId, previousStatus, newStatus, updatedAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"updateAdGroupStatus","params":{"customerId":"<ID>","adGroupId":"<ID>","status":"<value>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `updateAdGroupBid`

Modifies the default CPC bid for an ad group. This affects all keywords in the ad group that don't have individual keyword-level bids. Verify bidding strategy before calling — this only applies to manual CPC campaigns or campaigns with bidding strategies that respect manual bid overrides. RISKY — requires explicit user confirmation.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `adGroupId` (string, **required**): Ad group ID
- `cpcBidAmount` (number, **required**): New default CPC bid in account currency

**Returns:**

`AdapterOperationResult`: Confirmation with adGroupId, adGroupName, previousBid, newBid, biddingStrategyType, updatedAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"updateAdGroupBid","params":{"customerId":"<ID>","adGroupId":"<ID>","cpcBidAmount":10}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `listKeywords`

Lists all keywords in an ad group (or across a campaign) with performance metrics and quality scores. This is one of the most informative operations — quality score components (expectedCtr, adRelevance, landingPageExperience) reveal structural issues in the account. Keywords with high cost and zero conversions are the primary target for the wasteful-spend-detection skill. Note: quality score is only available when there is sufficient impression volume.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `adGroupId` (string, *optional*): Filter to one ad group. If omitted, scope to campaignId
- `campaignId` (string, *optional*): Filter to all ad groups within a campaign. One of adGroupId or campaignId required
- `dateRange` (string, *optional*): Default: LAST_30_DAYS
- `status` (string, *optional*): ENABLED, PAUSED, or ALL. Default: ENABLED
- `limit` (number, *optional*): Default: 200, max: 500
- `orderBy` (string, *optional*): cost, conversions, cpa, impressions. Default: cost

**Returns:**

`AdapterOperationResult`: List of keywords with quality scores and performance metrics

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"listKeywords","params":{"customerId":"<ID>"}}' | jq .
```

### `getKeywordDetails`

Detailed metrics for a single keyword with daily breakdown. Use this to understand the performance trend for a specific keyword — especially useful when a keyword's cost is spiking or conversion rate is dropping.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `keywordId` (string, **required**): Keyword criterion ID
- `adGroupId` (string, **required**): Ad group containing the keyword (required by GAQL scoping)
- `dateRange` (string, *optional*): Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Keyword details with daily metrics breakdown

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getKeywordDetails","params":{"customerId":"<ID>","keywordId":"<ID>","adGroupId":"<ID>"}}' | jq .
```

### `updateKeywordStatus`

Pauses or enables a specific keyword. Use this to stop a specific keyword from spending without touching the ad group. Always confirm the keyword text, match type, and current cost before pausing. RISKY — requires explicit user confirmation.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `keywordId` (string, **required**): Keyword criterion ID
- `adGroupId` (string, **required**): Ad group containing the keyword
- `status` (string, **required**): PAUSED or ENABLED

**Returns:**

`AdapterOperationResult`: Confirmation with keywordId, keywordText, matchType, adGroupId, previousStatus, newStatus, updatedAt

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"updateKeywordStatus","params":{"customerId":"<ID>","keywordId":"<ID>","adGroupId":"<ID>","status":"<value>"}}' | jq .
```

> **Warning:** This is a destructive operation. Confirm with the user before executing.

### `getSearchTermReport`

Returns the actual search queries that users typed which triggered your ads. This is the single most actionable report in Google Ads — it shows you what you're actually paying for. Look for: (1) irrelevant queries that should become negative keywords, (2) high-performing queries not yet added as exact-match keywords, (3) expensive queries with no conversions. The status field shows whether a term has already been added as a keyword (ADDED) or excluded as a negative (EXCLUDED).

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, *optional*): Filter to a specific campaign
- `adGroupId` (string, *optional*): Filter to a specific ad group
- `dateRange` (string, *optional*): Default: LAST_30_DAYS
- `minImpressions` (number, *optional*): Filter out terms with fewer impressions. Default: 0
- `limit` (number, *optional*): Default: 200, max: 500
- `orderBy` (string, *optional*): cost, conversions, impressions, cpa. Default: cost

**Returns:**

`AdapterOperationResult`: List of search terms with performance metrics and status

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getSearchTermReport","params":{"customerId":"123-456-7890","campaignId":"22222","dateRange":"LAST_30_DAYS","orderBy":"cost"}}' | jq .
```

**Example response:**

```json
{
  "type": "searchTerms",
  "count": 47,
  "entities": [
    {
      "searchTerm": "free accounting software",
      "matchType": "BROAD",
      "keywordText": "accounting software",
      "adGroupId": "333",
      "adGroupName": "Accounting Keywords",
      "campaignId": "22222",
      "campaignName": "Non-Brand - Broad",
      "status": "NONE",
      "metrics": {
        "impressions": 1200,
        "clicks": 180,
        "cost": 320.4,
        "conversions": 0,
        "ctr": 0.15
      }
    }
  ]
}
```

### `getKeywordIdeas`

Uses the Google Keyword Planner API to generate keyword ideas from seed keywords or a landing page URL. Returns estimated monthly search volume, competition level, and bid estimates for each idea. Use this to find untapped keyword opportunities — compare lowTopOfPageBid vs your current avgCpc to find underpriced opportunities. Rate limited to 100 requests/day — use sparingly.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `seedKeywords` (array, *optional*): Array of seed keyword strings (max 20). One of seedKeywords or pageUrl required
- `pageUrl` (string, *optional*): Landing page URL to generate ideas from. One of seedKeywords or pageUrl required
- `language` (string, *optional*): Language resource name (default: English — languageConstants/1000)
- `geoTargets` (array, *optional*): Array of geo target constant resource names. Default: all locations
- `limit` (number, *optional*): Max ideas to return. Default: 100, max: 1000

**Returns:**

`AdapterOperationResult`: List of keyword ideas with search volume, competition, and bid estimates

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getKeywordIdeas","params":{"customerId":"123-456-7890","seedKeywords":["accounting software","bookkeeping app","small business accounting"],"limit":50}}' | jq .
```

**Example response:**

```json
{
  "type": "keywordIdeas",
  "count": 50,
  "entities": [
    {
      "text": "cloud accounting software",
      "avgMonthlySearches": 22200,
      "competitionLevel": "HIGH",
      "competitionIndex": 87,
      "lowTopOfPageBid": 2.4,
      "highTopOfPageBid": 8.9
    },
    {
      "text": "best accounting app for freelancers",
      "avgMonthlySearches": 880,
      "competitionLevel": "LOW",
      "competitionIndex": 18,
      "lowTopOfPageBid": 0.8,
      "highTopOfPageBid": 2.1
    }
  ]
}
```

### `listAds`

Lists all ads within an ad group with performance metrics and quality signals. For Responsive Search Ads (RSA), includes the headlines and descriptions as arrays. Use this to identify top-performing ad copy — compare CTR and conversion rate across variants to understand what messaging resonates. adStrength (EXCELLENT/GOOD/POOR) is Google's own quality signal for RSA.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `adGroupId` (string, **required**): Ad group to list ads from
- `dateRange` (string, *optional*): Default: LAST_30_DAYS
- `status` (string, *optional*): ENABLED, PAUSED, or ALL. Default: ALL

**Returns:**

`AdapterOperationResult`: List of ads with headlines, descriptions, and performance metrics

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"listAds","params":{"customerId":"<ID>","adGroupId":"<ID>"}}' | jq .
```

### `getAdDetails`

Detailed metrics for a single ad with daily breakdown. Most useful for spotting when an ad's CTR or conversion rate changed — the daily trend reveals if a recent landing page change or ad copy edit correlated with a performance shift.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `adId` (string, **required**): Ad ID
- `adGroupId` (string, **required**): Ad group containing the ad
- `dateRange` (string, *optional*): Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Ad details with daily metrics breakdown

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getAdDetails","params":{"customerId":"<ID>","adId":"<ID>","adGroupId":"<ID>"}}' | jq .
```

### `getPerformanceReport`

Flexible performance report with custom dimension and metric selection. Use this for custom analyses not covered by the dedicated reports — e.g., performance by network, by day of week, or a combined campaign+device breakdown. Returns a flat array of rows with whatever dimensions/metrics were requested. Prefer the dedicated reports (getDeviceReport, getHourOfDayReport, etc.) for their respective use cases.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `dimensions` (array, **required**): Dimensions to segment by: campaign, adGroup, keyword, device, network, date, dayOfWeek, hour, geo, matchType. At least one required
- `metrics` (array, *optional*): Metrics to include: impressions, clicks, cost, conversions, conversionsValue, ctr, avgCpc, cpa, roas. Default: all standard metrics
- `dateRange` (string, *optional*): Default: LAST_30_DAYS
- `campaignId` (string, *optional*): Filter to a specific campaign
- `filters` (object, *optional*): Additional GAQL WHERE conditions as key-value pairs
- `orderBy` (string, *optional*): Metric to sort by (descending). Default: cost
- `limit` (number, *optional*): Default: 200, max: 500

**Returns:**

`AdapterOperationResult`: Performance report with specified dimensions and metrics

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getPerformanceReport","params":{"customerId":"<ID>","dimensions":[]}}' | jq .
```

### `getAuctionInsights`

Returns auction insights showing how your ads compete against other advertisers in the same auctions. This is your window into the competitive landscape. Key metrics: impressionShare (your slice), overlapRate (how often you compete directly), outRankingShare (how often you beat them). Scoped to a campaign or ad group.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, *optional*): Scope to a campaign. One of campaignId or adGroupId required
- `adGroupId` (string, *optional*): Scope to an ad group
- `dateRange` (string, *optional*): Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Competitor auction insights with impression share, overlap rate, and outranking share

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getAuctionInsights","params":{"customerId":"123-456-7890","campaignId":"11111"}}' | jq .
```

**Example response:**

```json
{
  "type": "auctionInsights",
  "scope": "campaign:11111",
  "count": 4,
  "entities": [
    {
      "domain": "competitorA.com",
      "impressionShare": 0.68,
      "overlapRate": 0.42,
      "outRankingShare": 0.31,
      "topOfPageRate": 0.55,
      "absoluteTopOfPageRate": 0.28
    }
  ]
}
```

### `getChangeHistory`

Returns a log of changes made to the account within the date range. Essential for diagnosing sudden performance shifts — check change history for that date to see if someone adjusted bids, paused keywords, or changed budget. Also useful for governance: knowing who changed what and when. Max lookback: 90 days.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `dateRange` (string, *optional*): Default: LAST_7_DAYS. Max lookback: 90 days
- `resourceTypes` (array, *optional*): Filter to specific types: CAMPAIGN, AD_GROUP, AD, AD_GROUP_CRITERION. Default: all
- `limit` (number, *optional*): Default: 100, max: 500

**Returns:**

`AdapterOperationResult`: List of change history entries with who/what/when details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getChangeHistory","params":{"customerId":"<ID>"}}' | jq .
```

### `getConversionReport`

Reports on conversion performance broken down by conversion action (e.g., "Purchase", "Lead Form Submit", "Phone Call"). Use this to understand which types of conversions your campaigns are driving and whether your conversion tracking is set up correctly. Missing conversion actions with zero data can indicate tracking gaps.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, *optional*): Filter to a specific campaign
- `dateRange` (string, *optional*): Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Conversion report with actions, categories, values, and cost-per-conversion

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getConversionReport","params":{"customerId":"<ID>"}}' | jq .
```

### `getGeographicReport`

Performance broken down by country, region, or city. Use this to find geographic concentrations of conversions or waste. A campaign running nationally but converting only in two metros is a candidate for geo-targeting refinement.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, *optional*): Filter to a specific campaign
- `granularity` (string, *optional*): COUNTRY, REGION, or CITY. Default: REGION
- `dateRange` (string, *optional*): Default: LAST_30_DAYS
- `limit` (number, *optional*): Default: 100

**Returns:**

`AdapterOperationResult`: Geographic performance report with location names and metrics

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getGeographicReport","params":{"customerId":"<ID>"}}' | jq .
```

### `getDeviceReport`

Performance broken down by device type (desktop, mobile, tablet). Use this to identify device-specific performance gaps — a campaign with 80% of spend on mobile but 90% of conversions on desktop has a misaligned device bid modifier. Check if searchImpressionShare varies significantly by device — that indicates a bidding opportunity.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, *optional*): Filter to a specific campaign. Default: account-level
- `dateRange` (string, *optional*): Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Device breakdown with desktop, mobile, tablet, and connected TV metrics

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getDeviceReport","params":{"customerId":"123-456-7890","campaignId":"22222","dateRange":"LAST_30_DAYS"}}' | jq .
```

**Example response:**

```json
{
  "type": "deviceReport",
  "rows": [
    {
      "device": "DESKTOP",
      "metrics": {
        "cost": 3200,
        "conversions": 180,
        "cpa": 17.78
      }
    },
    {
      "device": "MOBILE",
      "metrics": {
        "cost": 1800,
        "conversions": 28,
        "cpa": 64.29
      }
    },
    {
      "device": "TABLET",
      "metrics": {
        "cost": 400,
        "conversions": 8,
        "cpa": 50
      }
    }
  ]
}
```

### `getHourOfDayReport`

Performance segmented by hour of day AND day of week. Use this to identify optimal ad scheduling windows and discover hours with high spend but low conversion rates. A peak-hour analysis often reveals that campaigns running 24/7 are wasting budget between midnight and 6am with no conversions.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, *optional*): Filter to a specific campaign
- `dateRange` (string, *optional*): Recommend at least LAST_30_DAYS for meaningful hourly data. Default: LAST_30_DAYS

**Returns:**

`AdapterOperationResult`: Hour-of-day and day-of-week performance breakdown

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getHourOfDayReport","params":{"customerId":"<ID>"}}' | jq .
```

### `listBudgets`

Lists all campaign budgets in the account, including shared budgets and how many campaigns are using each budget. Shared budgets are often a source of unexpected spend distribution — if three campaigns share one budget, Google will allocate it across all three based on predicted performance, not evenly. Returns current utilization for each budget.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `includeRemoved` (boolean, *optional*): Include removed budgets. Default: false

**Returns:**

`AdapterOperationResult`: List of budgets with amounts, delivery method, campaign count, and utilization

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"listBudgets","params":{"customerId":"<ID>"}}' | jq .
```

### `getBudgetRecommendations`

Returns Google's automated budget recommendations for campaigns that are budget-constrained. Google identifies campaigns where impression share loss due to budget would improve if budget were increased, and estimates the incremental conversions/clicks from the recommended increase. Use this to inform budget reallocation decisions — but always verify with your own ROAS analysis rather than relying solely on Google's estimates.

**Arguments:**

- `customerId` (string, **required**): Google Ads account ID
- `campaignId` (string, *optional*): Filter to a specific campaign

**Returns:**

`AdapterOperationResult`: Budget recommendations with estimated incremental clicks, conversions, and cost

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"google-ads","method":"getBudgetRecommendations","params":{"customerId":"<ID>"}}' | jq .
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
