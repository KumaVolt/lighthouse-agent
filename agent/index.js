import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";
import fs from "fs";

const app = express();
app.use(bodyParser.json());

app.post("/audit", async (req, res) => {
  const { url, callback_url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url'" });
  }

  const tempFile = `/tmp/report-${Date.now()}.json`;
  const cmd = `lighthouse "${url}" --output json --output-path=${tempFile} --quiet --chrome-flags="--headless --no-sandbox"`;

  const runAudit = () => {
    exec(cmd, async (error) => {
      if (error) {
        console.error("❌ Lighthouse error:", error);
        if (!callback_url) {
          return res.status(500).json({ error: "Lighthouse failed" });
        }
        return;
      }

      const report = fs.readFileSync(tempFile, "utf8");
      const result = {
        url,
        results: JSON.parse(report),
        agent: process.env.AGENT_ID || "default",
      };

      if (callback_url) {
        // Async mode
        fetch(callback_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(result),
        }).catch(console.error);
      } else {
        res.json(result);
      }
    });
  };

  if (callback_url) {
    res.json({ status: "running", url });
    runAudit();
  } else {
    runAudit();
  }
});

app.get("/audit", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' query parameter" });
  }

  const tempFile = `/tmp/report-${Date.now()}.json`;
  const cmd = `lighthouse "${url}" --output json --output-path=${tempFile} --quiet --chrome-flags="--headless --no-sandbox"`;

  exec(cmd, (error) => {
    if (error) {
      console.error("❌ Lighthouse error:", error);
      return res.status(500).json({ error: "Lighthouse failed" });
    }

    const report = fs.readFileSync(tempFile, "utf8");
    res.json({
      url,
      results: JSON.parse(report),
      agent: process.env.AGENT_ID || "default"
    });
  });
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Agent running on port ${PORT}`));
