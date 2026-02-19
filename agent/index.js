import express from "express";
import bodyParser from "body-parser";
import { runLighthouseAudit } from "./lib/audit.js";

const app = express();
app.use(bodyParser.json());

app.post("/audit", async (req, res) => {
    const { url, callback_url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    if (callback_url) {
        res.json({ status: "running", url });
        runAudit(url, callback_url, null);
    } else {
        runAudit(url, null, res);
    }
});

app.get("/audit", async (req, res) => {
    const url = req.query.url;

    if (!url) {
        return res.status(400).json({ error: "Missing 'url' query parameter" });
    }

    runAudit(url, null, res);
});

app.get("/health", (_, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Agent running on port ${PORT}`));

const runAudit = (url, callback_url, res) => {
    runLighthouseAudit(url)
        .then((report) => {
            const result = {
                url,
                results: report,
                agent: process.env.AGENT_ID || "default",
            };

            if (callback_url) {
                fetch(callback_url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(result),
                }).catch(console.error);
            } else {
                res.json(result);
            }
        })
        .catch((error) => {
            console.error("❌ Lighthouse error:", error);
            if (!callback_url) {
                res.status(500).json({ error: "Lighthouse failed" });
            }
        });
};
