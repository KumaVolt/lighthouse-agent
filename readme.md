# Lighthouse Agent

Run [Google Lighthouse](https://developer.chrome.com/docs/lighthouse) audits remotely via a REST API or directly from AI assistants through [MCP (Model Context Protocol)](https://modelcontextprotocol.io). Get performance scores, accessibility reports, SEO analysis, and Core Web Vitals for any URL.

Supports Docker deployment, async callbacks, and both local (stdio) and network (HTTP) MCP transports.

Requires Node.js 18+ and Chromium.

## Quick Start

### Docker (recommended)

```bash
docker compose up -d
```

This starts:
- **Express API** on port `3000`
- **MCP server** on port `3001` (Streamable HTTP transport)

To disable the MCP server, set `DISABLE_MCP=true` in your `docker-compose.yml` or environment.

### Local

```bash
cd agent
npm install
npm start        # Express API on port 3000
```

## REST API

### GET /audit

```bash
curl "http://localhost:3000/audit?url=https://example.com"
```

### POST /audit

Synchronous — returns the full report in the response:

```json
{
  "url": "https://example.com"
}
```

Asynchronous — returns immediately and POSTs results to the callback URL:

```json
{
  "url": "https://example.com",
  "callback_url": "https://your-api.com/api/audit-result"
}
```

### GET /health

Returns `{ "status": "ok" }`.

## MCP Server

The MCP server lets AI assistants (Claude Code, Cursor, etc.) run Lighthouse audits as tools without HTTP calls.

### Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `run_audit` | Category scores (0-100) + Core Web Vitals | `url` (required), `category` (optional: all, performance, accessibility, best-practices, seo) |
| `run_audit_full` | Complete raw Lighthouse JSON report | `url` (required) |

### Local (stdio) — Claude Code auto-discovery

The included `.mcp.json` lets Claude Code discover the server automatically when working in this project. No configuration needed.

To run manually:

```bash
cd agent
npm run mcp
```

### Network (HTTP) — Docker or remote

When running in Docker, the MCP server listens on port `3001` at the `/mcp` endpoint using Streamable HTTP transport.

To run locally in HTTP mode:

```bash
cd agent
npm run mcp:http
```

Connect any MCP client to `http://localhost:3001/mcp`.

### Test with MCP Inspector

```bash
cd agent
npx @modelcontextprotocol/inspector node mcp-server.js
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Express API port |
| `MCP_PORT` | `3001` | MCP HTTP server port |
| `MCP_TRANSPORT` | `stdio` | MCP transport mode: `stdio` or `http` |
| `DISABLE_MCP` | `false` | Set to `true` to skip MCP server in Docker |
| `AGENT_ID` | `default` | Identifier included in API responses |

## Project Structure

```
lighthouse-agent/
  .mcp.json              # Claude Code MCP auto-discovery
  Dockerfile
  docker-compose.yml
  agent/
    index.js             # Express API server
    mcp-server.js        # MCP server (stdio + HTTP)
    start.js             # Docker entry point (runs both)
    lib/
      audit.js           # Shared Lighthouse audit logic
    package.json
```

## License

MIT
