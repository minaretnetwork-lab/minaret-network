import { execFileSync, spawn } from "node:child_process";
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
const runDirectory = path.join(workspace, "run");
fs.mkdirSync(logDirectory, { recursive: true });
fs.mkdirSync(runDirectory, { recursive: true });
const environmentName = process.env.MINARET_ENVIRONMENT ?? port;
const stdoutLogPath = path.join(logDirectory, `server-${environmentName}.out.log`);
const stderrLogPath = path.join(logDirectory, `server-${environmentName}.err.log`);
const pidPath = path.join(runDirectory, `server-${environmentName}.pid`);
const hasProductionBuild = fs.existsSync(path.join(workspace, distDir, "BUILD_ID"));
const command = hasProductionBuild ? "start" : "dev";
const nodeEnvironment = hasProductionBuild ? "production" : "development";

function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isMinaretServerProcess(pid) {
  if (!isPidAlive(pid)) return false;

  if (process.platform !== "win32") return true;

  try {
    const commandLine = execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `(Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}').CommandLine`,
      ],
      { encoding: "utf8", windowsHide: true },
    ).trim();
    const normalized = commandLine.toLowerCase();
    return normalized.includes("next") &&
      normalized.includes(" start ") &&
      normalized.includes(`-p ${port}`) &&
      normalized.includes(workspace.toLowerCase());
  } catch {
    return false;
  }
}

if (fs.existsSync(pidPath)) {
  const existingPid = Number.parseInt(fs.readFileSync(pidPath, "utf8").trim(), 10);
  if (isMinaretServerProcess(existingPid)) {
    console.log(`${environmentName} already running with PID ${existingPid}`);
    process.exit(0);
  }
  console.log(`Removing stale ${environmentName} PID file (${existingPid || "invalid"})`);
  fs.rmSync(pidPath, { force: true });
}

const stdoutLog = fs.openSync(stdoutLogPath, "a");
const stderrLog = fs.openSync(stderrLogPath, "a");
const child = spawn(process.execPath, [nextCli, command, "-H", host, "-p", port], {
  cwd: workspace,
  env: { ...process.env, NODE_ENV: nodeEnvironment },
  stdio: ["ignore", stdoutLog, stderrLog],
  windowsHide: true,
  detached: true,
});

child.unref();
fs.writeFileSync(pidPath, `${child.pid}\n`, "utf8");
console.log(`Started ${environmentName} on ${host}:${port} with PID ${child.pid}`);
