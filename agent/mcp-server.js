import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import http from "http";
import { runLighthouseAudit } from "./lib/audit.js";

const VALID_CATEGORIES = [
  "all",
  "performance",
  "accessibility",
  "best-practices",
  "seo",
];

function createServer() {
  const server = new McpServer({
    name: "lighthouse-agent",
    version: "1.0.0",
  });

  server.tool(
    "run_audit",
    "Run a Lighthouse audit and return category scores (0–100) and core web vitals for a URL",
    {
      url: z.string().url().describe("The URL to audit"),
      category: z
        .enum(VALID_CATEGORIES)
        .optional()
        .default("all")
        .describe(
          "Which category to audit: all, performance, accessibility, best-practices, or seo"
        ),
    },
    async ({ url, category }) => {
      try {
        const report = await runLighthouseAudit(url);

        const categories = report.categories || {};
        const scores = {};
        for (const [key, val] of Object.entries(categories)) {
          if (category === "all" || key === category) {
            scores[key] = Math.round((val.score || 0) * 100);
          }
        }

        const audits = report.audits || {};
        const vitals = {};
        const vitalKeys = [
          "first-contentful-paint",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "speed-index",
          "interactive",
        ];
        for (const key of vitalKeys) {
          if (audits[key]) {
            vitals[key] = {
              score: Math.round((audits[key].score || 0) * 100),
              value: audits[key].displayValue || audits[key].numericValue,
            };
          }
        }

        const result = { url, scores, vitals };

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Lighthouse audit failed: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "run_audit_full",
    "Run a Lighthouse audit and return the complete raw JSON report for a URL",
    {
      url: z.string().url().describe("The URL to audit"),
    },
    async ({ url }) => {
      try {
        const report = await runLighthouseAudit(url);

        return {
          content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Lighthouse audit failed: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  return server;
}

const transport = process.env.MCP_TRANSPORT || "stdio";

if (transport === "http") {
  const port = parseInt(process.env.MCP_PORT || "3001", 10);
  const server = createServer();

  const httpTransport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  await server.connect(httpTransport);

  const httpServer = http.createServer(async (req, res) => {
    if (req.url === "/mcp" || req.url?.startsWith("/mcp?")) {
      await httpTransport.handleRequest(req, res);
    } else if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
    } else {
      res.writeHead(404);
      res.end("Not found");
    }
  });

  httpServer.listen(port, () => {
    console.log(`MCP server (Streamable HTTP) listening on port ${port}`);
  });
} else {
  const server = createServer();
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
}
