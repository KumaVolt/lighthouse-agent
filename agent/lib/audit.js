import { execFile } from "child_process";
import fs from "fs";

/**
 * Run a Lighthouse audit on the given URL.
 * @param {string} url - The URL to audit.
 * @returns {Promise<object>} Parsed Lighthouse JSON report.
 */
export function runLighthouseAudit(url) {
  return new Promise((resolve, reject) => {
    const safeUrl = url.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const tempFile = `/tmp/report-${safeUrl}-${Date.now()}.json`;
    const args = [
      url,
      "--output=json",
      `--output-path=${tempFile}`,
      "--chrome-flags=--headless --no-sandbox",
    ];

    execFile("lighthouse", args, (error) => {
      if (error) {
        // Clean up temp file on error too
        fs.unlink(tempFile, () => {});
        return reject(error);
      }

      let report;
      try {
        report = fs.readFileSync(tempFile, "utf8");
      } catch (readErr) {
        return reject(readErr);
      } finally {
        fs.unlink(tempFile, () => {});
      }

      try {
        resolve(JSON.parse(report));
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}
