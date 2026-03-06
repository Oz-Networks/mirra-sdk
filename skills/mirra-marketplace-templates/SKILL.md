---
name: mirra-marketplace-templates
description: "Use Mirra to pre-packaged bundles (page + scripts + resources) from github. Covers all Marketplace Templates SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Marketplace Templates

Pre-packaged bundles (Page + Scripts + Resources) from GitHub

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
    "resourceId": "marketplace-templates",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/marketplaceTemplates/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `create` | Create a new template |
| `sync` | Sync template from GitHub |
| `build` | Build a template |
| `publish` | Publish template to marketplace |
| `install` | Install a template |
| `uninstall` | Uninstall a template |
| `listInstallations` | List user template installations |
| `getInstallation` | Get installation details |
| `updateInstallation` | Update installation to new version |
| `checkRequirements` | Check installation requirements |
| `estimateCost` | Estimate installation cost |
| `listVersions` | List template versions |
| `createVersion` | Create new template version |
| `getBuildStatus` | Get template build status |

## Operation Details

### `create`

Create a new template

**Returns:**

`object`: Created template details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"create","params":{}}' | jq .
```

### `sync`

Sync template from GitHub

**Returns:**

`object`: Synced template details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"sync","params":{}}' | jq .
```

### `build`

Build a template

**Returns:**

`object`: Build status and output

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"build","params":{}}' | jq .
```

### `publish`

Publish template to marketplace

**Returns:**

`object`: Published template details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"publish","params":{}}' | jq .
```

### `install`

Install a template

**Returns:**

`object`: Installation details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"install","params":{}}' | jq .
```

### `uninstall`

Uninstall a template

**Returns:**

`object`: Uninstall confirmation

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"uninstall","params":{}}' | jq .
```

### `listInstallations`

List user template installations

**Returns:**

`object`: List of installations

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"listInstallations","params":{}}' | jq .
```

### `getInstallation`

Get installation details

**Returns:**

`object`: Installation details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"getInstallation","params":{}}' | jq .
```

### `updateInstallation`

Update installation to new version

**Returns:**

`object`: Updated installation details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"updateInstallation","params":{}}' | jq .
```

### `checkRequirements`

Check installation requirements

**Returns:**

`object`: Requirements check result

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"checkRequirements","params":{}}' | jq .
```

### `estimateCost`

Estimate installation cost

**Returns:**

`object`: Cost estimate

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"estimateCost","params":{}}' | jq .
```

### `listVersions`

List template versions

**Returns:**

`object`: List of versions

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"listVersions","params":{}}' | jq .
```

### `createVersion`

Create new template version

**Returns:**

`object`: Created version details

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"createVersion","params":{}}' | jq .
```

### `getBuildStatus`

Get template build status

**Returns:**

`object`: Build status

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"marketplace-templates","method":"getBuildStatus","params":{}}' | jq .
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
