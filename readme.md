# Lighthouse Agent

A lightweight Node.js server to run Lighthouse CLI audits remotely and POST results to a callback URL.

## 🧪 API

The agent exposes two endpoints to trigger Lighthouse audits. You can call the
service using either `POST /audit` with a JSON body or `GET /audit` with a query
parameter.

### POST `/audit`

Request payload:
```json
{
  "url": "https://example.com",
  "callback_url": "https://your-api.com/api/audit-result"
}
```

Example synchronous response:
```json
{
  "url": "https://example.com",
  "results": { /* lighthouse report object */ },
  "agent": "default"
}
```

If a `callback_url` is provided the endpoint immediately responds with:
```json
{
  "status": "running",
  "url": "https://example.com"
}
```
and later POSTs the full result to the callback URL.

### GET `/audit`

Call this endpoint with a `url` query parameter:

```
GET /audit?url=https://example.com
```

Response:
```json
{
  "url": "https://example.com",
  "results": { /* lighthouse report object */ },
  "agent": "default"
}
```
