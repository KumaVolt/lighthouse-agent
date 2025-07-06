import express from "express";
import bodyParser from "body-parser";
import { exec } from "child_process";
import fs from "fs";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

app.post("/run-audit", async (req, res) => {
  const { url, callback_url } = req.body;

  if (!url || !callback_url) {
    return res.status(400).json({ error: "Missing 'url' or 'callback_url'" });
  }

  const tempFile = `/tmp/report-${Date.now()}.json`;
  const cmd = `lighthouse "${url}" --output json --output-path=${tempFile} --quiet --chrome-flags="--headless --no-sandbox"`;

  exec(cmd, async (error) => {
    if (error) {
      console.error("Lighthouse error:", error);
      return res.status(500).json({ error: "Lighthouse failed" });
    }

    const report = fs.readFileSync(tempFile, "utf8");

    fetch(callback_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url,
        results: JSON.parse(report),
        agent: process.env.AGENT_ID || "default"
      }),
    }).catch(console.error);

    res.json({ status: "running", url });
  });
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Agent running on port ${PORT}`));