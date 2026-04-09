---
name: mirra-video-generator
description: "Use Mirra to render videos from parameterized remotion templates on aws lambda. Covers all Video Generator SDK operations via REST API."
allowed-tools: Read, Bash(curl:*, jq:*)
---

# Mirra Video Generator

Render videos from parameterized Remotion templates on AWS Lambda

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
    "resourceId": "video-generator",
    "method": "{operation}",
    "params": { ...args }
  }' | jq .
```

Replace `{operation}` with the operation name from the table below.

> **Legacy alternative:** `POST ${API_URL}/api/sdk/v1/videoGenerator/{operation}` with args as the request body also works but is not recommended for new integrations.


## Available Operations

| Operation | Description |
|-----------|-------------|
| `listTemplates` | List available video composition templates. Returns template IDs, descriptions, input schemas, an... |
| `renderVideo` | Start rendering a video using a template and input props. Returns immediately with a renderId — u... |
| `getRenderStatus` | Check the progress of a video render. Returns status (rendering/completed/failed), progress (0-1)... |
| `renderCustomVideo` | Render a video from custom Remotion React code. Write a React component using Remotion APIs (useC... |
| `previewFrame` | Render a single preview frame from custom Remotion React code. Returns almost instantly (~2-3s) w... |

## Operation Details

### `listTemplates`

List available video composition templates. Returns template IDs, descriptions, input schemas, and default settings. Use this first to see what templates are available before rendering.

**Returns:**

`AdapterOperationResult`: Returns { count, templates[] }. Each template: { templateId, name, description, previewUrl, inputSchema, defaults }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"video-generator","method":"listTemplates","params":{}}' | jq .
```

**Example response:**

```json
{
  "count": 1,
  "templates": [
    {
      "templateId": "social-clip",
      "name": "Social Media Clip",
      "description": "Short-form social media video with title, body text, and optional background image",
      "inputSchema": {
        "title": {
          "type": "string",
          "required": true,
          "description": "Main title text"
        },
        "backgroundImage": {
          "type": "media_url",
          "required": false,
          "description": "Background image URL"
        }
      },
      "defaults": {
        "width": 1080,
        "height": 1080,
        "fps": 30,
        "durationInFrames": 300,
        "codec": "h264"
      }
    }
  ]
}
```

### `renderVideo`

Start rendering a video using a template and input props. Returns immediately with a renderId — use getRenderStatus to poll for completion. Input props must match the template's inputSchema. Props with type "media_url" should be CDN URLs from the user's uploaded files (images, audio, etc.).

**Arguments:**

- `templateId` (string, **required**): Template ID from listTemplates
- `inputProps` (object, **required**): Dynamic props matching the template inputSchema (text, image URLs, colors, etc.)
- `codec` (string, *optional*): Video codec: h264 (default), h265, vp8, vp9
- `width` (number, *optional*): Override template default width in pixels
- `height` (number, *optional*): Override template default height in pixels
- `fps` (number, *optional*): Override template default frames per second
- `durationInFrames` (number, *optional*): Override template default duration in frames

**Returns:**

`AdapterOperationResult`: Returns { renderId, status: "rendering", templateId, message }. Poll getRenderStatus with the renderId to check progress.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"video-generator","method":"renderVideo","params":{"templateId":"social-clip","inputProps":{"title":"Welcome to Mirra","subtitle":"Your AI-powered workspace","backgroundImage":"https://cdn.mirra.app/users/abc/files/hero.png"}}}' | jq .
```

**Example response:**

```json
{
  "renderId": "render-abc123",
  "status": "rendering",
  "templateId": "social-clip",
  "message": "Render started. Use getRenderStatus to poll for progress."
}
```

### `getRenderStatus`

Check the progress of a video render. Returns status (rendering/completed/failed), progress (0-1), and videoUrl when complete. If failed, returns an error message with recovery suggestions.

**Arguments:**

- `renderId` (string, **required**): Render ID from renderVideo response

**Returns:**

`AdapterOperationResult`: Returns { renderId, status, progress, videoUrl?, error?, errorDetails? }.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"video-generator","method":"getRenderStatus","params":{"renderId":"render-abc123"}}' | jq .
```

**Example response:**

```json
{
  "renderId": "render-abc123",
  "status": "completed",
  "progress": 1,
  "videoUrl": "https://s3.amazonaws.com/remotionlambda-xxx/renders/render-abc123/out.mp4"
}
```

### `renderCustomVideo`

Render a video from custom Remotion React code. Write a React component using Remotion APIs (useCurrentFrame, interpolate, spring, AbsoluteFill, Sequence, etc.) and this operation compiles and renders it. Returns a renderId — poll getRenderStatus for completion. Available APIs: useCurrentFrame(), useVideoConfig(), interpolate(), interpolateColors(), spring(), Easing, random(), AbsoluteFill, Img, Sequence, Series, Loop, Audio, Video, IFrame. Code must define a function App() that returns JSX. No imports needed — all APIs are pre-injected. To add audio/music, use <Audio src="cdn_url" /> inside the component. To start audio at a specific point in the video, wrap it in <Sequence from={frameNumber}>. To skip the beginning of an audio file, use <Audio startFrom={frameNumber} />. The user can upload audio files (mp3, m4a, wav) and you will see the CDN URL as [Uploaded audio file: url] in the conversation.

**Arguments:**

- `code` (string, *optional*): Remotion React JSX code defining a function App() component. No imports needed — all Remotion APIs are available as globals. Required unless path is provided.
- `path` (string, *optional*): Path to a JSX file in the workspace container (e.g., "/workspace/videos/my-video/App.jsx"). If provided, code is read from this file instead of the code parameter.
- `codec` (string, *optional*): Video codec: h264 (default), h265, vp8, vp9
- `width` (number, *optional*): Video width in pixels (default: 1080)
- `height` (number, *optional*): Video height in pixels (default: 1080)
- `fps` (number, *optional*): Frames per second (default: 30)
- `durationInFrames` (number, *optional*): Total duration in frames (default: 300 = 10s at 30fps)

**Returns:**

`AdapterOperationResult`: Returns { renderId, status: "rendering", message }. Poll getRenderStatus with the renderId to check progress.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"video-generator","method":"renderCustomVideo","params":{"code":"function App() {\n  const frame = useCurrentFrame();\n  const { fps } = useVideoConfig();\n  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });\n  const scale = spring({ frame, fps, config: { damping: 12 } });\n  return (\n    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>\n      <h1 style={{ color: 'white', fontSize: 72, opacity, transform: `scale(${scale})` }}>\n        Hello World\n      </h1>\n    </AbsoluteFill>\n  );\n}","width":1920,"height":1080,"durationInFrames":150}}' | jq .
```

**Example response:**

```json
{
  "renderId": "render-custom-abc123",
  "status": "rendering",
  "message": "Custom video render started. Use getRenderStatus to poll for progress."
}
```

### `previewFrame`

Render a single preview frame from custom Remotion React code. Returns almost instantly (~2-3s) with an image URL. Use this to iterate on video design before committing to a full render. Same code format as renderCustomVideo.

**Arguments:**

- `code` (string, *optional*): Remotion React JSX code defining a function App() component. Required unless path is provided.
- `path` (string, *optional*): Path to a JSX file in the workspace container. If provided, code is read from this file instead of the code parameter.
- `frame` (number, *optional*): Which frame to preview (default: 0). Use this to check different moments in the video.
- `width` (number, *optional*): Preview width in pixels (default: 1080)
- `height` (number, *optional*): Preview height in pixels (default: 1080)
- `fps` (number, *optional*): Frames per second for timing calculations (default: 30)
- `durationInFrames` (number, *optional*): Total duration in frames for timing calculations (default: 300)

**Returns:**

`AdapterOperationResult`: Returns { imageUrl, frame, width, height }. Show the image to the user for feedback before rendering the full video.

**Example:**

```bash
curl -s -X POST "${API_URL}/api/sdk/v2/resources/call" \
  -H "Content-Type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{"resourceId":"video-generator","method":"previewFrame","params":{"code":"function App() {\n  const frame = useCurrentFrame();\n  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });\n  return (\n    <AbsoluteFill style={{ backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>\n      <h1 style={{ color: 'white', fontSize: 64, opacity }}>Preview Test</h1>\n    </AbsoluteFill>\n  );\n}","frame":45}}' | jq .
```

**Example response:**

```json
{
  "imageUrl": "https://s3.amazonaws.com/remotionlambda-xxx/stills/still-abc123.png",
  "frame": 45,
  "width": 1080,
  "height": 1080
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
