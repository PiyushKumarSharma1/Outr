import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type {
  AgentJob,
  Approval,
  Campaign,
  DomainEvent,
  Lead,
  SuppressionEntry,
} from "@outr/contracts";

export type Database = {
  version: 1;
  leads: Lead[];
  campaigns: Campaign[];
  suppressions: SuppressionEntry[];
  approvals: Approval[];
  jobs: AgentJob[];
  events: DomainEvent[];
};

export interface DataStore {
  read(): Promise<Database>;
  update<T>(operation: (draft: Database) => T | Promise<T>): Promise<T>;
}

const clone = <T>(value: T): T => structuredClone(value);

export class JsonDataStore implements DataStore {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    private readonly path: string,
    private readonly seed: () => Database,
  ) {}

  async read(): Promise<Database> {
    await this.queue;
    return clone(await this.load());
  }

  async update<T>(operation: (draft: Database) => T | Promise<T>): Promise<T> {
    let result!: T;
    let operationError: unknown;

    const work = this.queue.then(async () => {
      const draft = clone(await this.load());
      try {
        result = await operation(draft);
        await this.persist(draft);
      } catch (error) {
        operationError = error;
      }
    });

    this.queue = work.catch(() => undefined);
    await work;
    if (operationError) throw operationError;
    return result;
  }

  private async load(): Promise<Database> {
    try {
      return JSON.parse(await readFile(this.path, "utf8")) as Database;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const initial = this.seed();
      await this.persist(initial);
      return initial;
    }
  }

  private async persist(database: Database): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const temporaryPath = `${this.path}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(database, null, 2)}\n`, "utf8");
    await rename(temporaryPath, this.path);
  }
}

export class MemoryDataStore implements DataStore {
  private database: Database;

  constructor(seed: Database) {
    this.database = clone(seed);
  }

  async read(): Promise<Database> {
    return clone(this.database);
  }

  async update<T>(operation: (draft: Database) => T | Promise<T>): Promise<T> {
    const draft = clone(this.database);
    const result = await operation(draft);
    this.database = draft;
    return result;
  }
}
