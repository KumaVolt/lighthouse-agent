import express from "express";
import bodyParser from "body-parser";
import { execFile } from "child_process";
import fs from "fs";

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

    const tempFile = `./report-${url}-${Date.now()}.json`;
    const args = [
        url,
        "--output=json",
        `--output-path=${tempFile}`,
        "--chrome-flags=--headless"
    ];

    execFile('lighthouse', args, async (error) => {
        if (error) {
            console.error("❌ Lighthouse error:", error);
            if (!callback_url) {
                return res.status(500).json({ error: "Lighthouse failed" });
            }
            return;
        }

        let report;
        try {
            report = fs.readFileSync(tempFile, "utf8");
        } finally {}

        const result = {
            url,
            results: JSON.parse(report),
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
    });
};
