import { appendFileSync, mkdirSync } from "fs";
import { join } from "path";

export function writeAuthDebugLog(event: string, details: Record<string, unknown> = {}) {
  if (process.env.MINARET_AUTH_DEBUG !== "true") return;

  try {
    const logDir = join(process.cwd(), "logs");
    mkdirSync(logDir, { recursive: true });
    appendFileSync(
      join(logDir, "auth-debug.log"),
      `${JSON.stringify({ at: new Date().toISOString(), event, ...details })}\n`,
      "utf8"
    );
  } catch (error) {
    console.error("[auth-debug] could not write auth debug log", error);
  }
}
