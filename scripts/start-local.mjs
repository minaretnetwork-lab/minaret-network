import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseDotEnvValue(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return trimmed;
}

function loadEnvFile(envPath) {
  if (!envPath) return;
  const resolved = path.isAbsolute(envPath) ? envPath : path.join(workspace, envPath);
  if (!fs.existsSync(resolved)) return;

  for (const line of fs.readFileSync(resolved, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/);
    if (!match) continue;
    process.env[match[1]] = parseDotEnvValue(match[2]);
  }
}

loadEnvFile(process.env.MINARET_ENV_FILE);

const nextCli = path.join(workspace, "node_modules", "next", "dist", "bin", "next");
const host = process.env.MINARET_HOST ?? "127.0.0.1";
const port = process.env.MINARET_PORT ?? "3220";
const distDir = process.env.NEXT_DIST_DIR ?? ".next";
const logDirectory = path.join(workspace, "logs");
fs.mkdirSync(logDirectory, { recursive: true });
const log = fs.openSync(path.join(logDirectory, `server-${process.env.MINARET_ENVIRONMENT ?? port}.log`), "a");
const hasProductionBuild = fs.existsSync(path.join(workspace, distDir, "BUILD_ID"));
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
