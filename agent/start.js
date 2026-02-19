import { spawn } from "child_process";

const children = [];

// Always start Express server
const express = spawn("node", ["index.js"], { stdio: "inherit" });
children.push(express);

// Start MCP server unless disabled
if (process.env.DISABLE_MCP !== "true") {
  const mcp = spawn(
    "node",
    ["mcp-server.js"],
    {
      stdio: "inherit",
      env: { ...process.env, MCP_TRANSPORT: "http" },
    }
  );
  children.push(mcp);
}

// Forward signals to children
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => {
    for (const child of children) child.kill(sig);
  });
}

// Exit when any child exits
for (const child of children) {
  child.on("exit", (code) => {
    for (const c of children) c.kill();
    process.exit(code ?? 1);
  });
}
