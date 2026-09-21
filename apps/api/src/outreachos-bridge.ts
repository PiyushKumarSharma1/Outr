import { existsSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

export type OutreachOSOperation = "status" | "overview" | "campaigns" | "campaign_stats" | "search_leads" | "run_cycle" | "run_agent";
export type OutreachOSBridgeStatus = {
  configured: boolean;
  root?: string;
  python?: string;
  writeEnabled: boolean;
  reason?: string;
};

export type OutreachOSRuntimeBridge = {
  status(): OutreachOSBridgeStatus;
  call(operation: OutreachOSOperation, input?: Record<string, unknown>): Promise<Record<string, unknown>>;
};

type BridgeOptions = {
  root?: string;
  python?: string;
  writeEnabled?: boolean;
  timeoutMs?: number;
  runnerPath?: string;
};

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const localRootCandidates = [
  resolve(process.cwd(), "../../OPENCODE_PROJECTS/OutreachOS"),
  resolve(process.cwd(), "../../../OPENCODE_PROJECTS/OutreachOS"),
  resolve(process.cwd(), "../../../../OPENCODE_PROJECTS/OutreachOS"),
  resolve(moduleDirectory, "../../../../../OPENCODE_PROJECTS/OutreachOS"),
];

const discoverLocalRoot = (): string | undefined => localRootCandidates.find((candidate) => existsSync(resolve(candidate, "src")));

export class PythonOutreachOSBridge implements OutreachOSRuntimeBridge {
  private readonly root: string | undefined;
  private readonly python: string;
  private readonly writeEnabled: boolean;
  private readonly timeoutMs: number;
  private readonly runnerPath: string;

  constructor(options: BridgeOptions = {}) {
    const configuredRoot = options.root ?? process.env.OUTREACHOS_ROOT;
    const root = configuredRoot || discoverLocalRoot();
    this.root = root && existsSync(resolve(root, "src")) ? resolve(root) : undefined;
    this.python = options.python ?? process.env.OUTREACHOS_PYTHON ?? (this.root && existsSync(resolve(this.root, ".venv/bin/python")) ? resolve(this.root, ".venv/bin/python") : "python3");
    this.writeEnabled = options.writeEnabled ?? process.env.OUTREACHOS_BRIDGE_WRITE_ENABLED === "true";
    this.timeoutMs = options.timeoutMs ?? 20_000;
    this.runnerPath = options.runnerPath ?? resolve(moduleDirectory, "outreachos_bridge.py");
  }

  status(): OutreachOSBridgeStatus {
    if (!this.root) return { configured: false, writeEnabled: false, reason: "Set OUTREACHOS_ROOT to an OutreachOS source checkout" };
    if (!existsSync(this.runnerPath)) return { configured: false, writeEnabled: false, reason: `Bridge runner missing: ${basename(this.runnerPath)}` };
    return { configured: true, root: this.root, python: this.python, writeEnabled: this.writeEnabled };
  }

  async call(operation: OutreachOSOperation, input: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    const state = this.status();
    if (!state.configured || !this.root) throw new OutreachOSBridgeError("OUTREACHOS_NOT_CONFIGURED", state.reason ?? "OutreachOS bridge is unavailable", 503);
    if (operation === "run_cycle" && !this.writeEnabled) throw new OutreachOSBridgeError("BRIDGE_WRITE_DISABLED", "Cycle execution is disabled for this bridge runtime", 403);
    const response = await this.execute({ operation, ...input });
    if (response.ok !== true) {
      const error = asRecord(response.error);
      throw new OutreachOSBridgeError(stringValue(error.code, "OUTREACHOS_BRIDGE_ERROR"), stringValue(error.message, "OutreachOS bridge request failed"), error.code === "NOT_FOUND" ? 404 : 502);
    }
    return asRecord(response.data);
  }

  private async execute(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    return new Promise((resolvePromise, rejectPromise) => {
      const child = spawn(this.python!, [this.runnerPath], {
        env: {
          ...process.env,
          OUTREACHOS_ROOT: this.root,
          OUTREACHOS_DB: process.env.OUTREACHOS_DB ?? resolve(this.root!, "outreachos.db"),
          OUTREACHOS_BRIDGE_WRITE_ENABLED: String(this.writeEnabled),
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";
      const timeout = setTimeout(() => child.kill("SIGTERM"), this.timeoutMs);
      child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
      child.once("error", (error) => { clearTimeout(timeout); rejectPromise(new OutreachOSBridgeError("OUTREACHOS_PROCESS_ERROR", error.message, 502)); });
      child.once("close", (code) => {
        clearTimeout(timeout);
        if (code !== 0) {
          rejectPromise(new OutreachOSBridgeError("OUTREACHOS_PROCESS_ERROR", stderr.trim() || `OutreachOS runner exited ${code}`, 502));
          return;
        }
        try {
          resolvePromise(asRecord(JSON.parse(stdout)));
        } catch {
          rejectPromise(new OutreachOSBridgeError("OUTREACHOS_PROCESS_ERROR", `OutreachOS runner returned invalid JSON${stderr ? `: ${stderr.trim()}` : ""}`, 502));
        }
      });
      child.stdin.end(JSON.stringify(payload));
    });
  }
}

export class OutreachOSBridgeError extends Error {
  constructor(public readonly code: string, message: string, public readonly statusCode: number) {
    super(message);
    this.name = "OutreachOSBridgeError";
  }
}

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const stringValue = (value: unknown, fallback: string): string => typeof value === "string" && value ? value : fallback;
