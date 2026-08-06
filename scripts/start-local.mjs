import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCli = path.join(workspace, "node_modules", "next", "dist", "bin", "next");
const host = process.env.MINARET_HOST ?? "127.0.0.1";
const port = process.env.MINARET_PORT ?? "3220";
const logDirectory = path.join(workspace, "logs");
fs.mkdirSync(logDirectory, { recursive: true });
const log = fs.openSync(path.join(logDirectory, "server.log"), "a");
const hasProductionBuild = fs.existsSync(path.join(workspace, ".next", "BUILD_ID"));
const command = hasProductionBuild ? "start" : "dev";
const nodeEnvironment = hasProductionBuild ? "production" : "development";

const child = spawn(process.execPath, [nextCli, command, "-H", host, "-p", port], {
  cwd: workspace,
  env: { ...process.env, NODE_ENV: nodeEnvironment },
  stdio: ["ignore", log, log],
  windowsHide: true,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}
