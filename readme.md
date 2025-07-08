# Lighthouse Agent

A lightweight Node.js server to run Lighthouse CLI audits remotely and POST results to a callback URL.

Requires Node.js 18 or higher.

## 🧪 API

POST `/audit`

```json
{
  "url": "https://example.com",
  "callback_url": "https://your-api.com/api/audit-result"
}
```
