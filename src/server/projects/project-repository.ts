import { randomUUID } from "node:crypto";
import { constants, mkdir, open, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import seedJson from "../../../data/projects.seed.json";
import {
  type EditableProject,
  type Project,
  type ProjectDocument,
  projectDocumentSchema,
} from "@/features/projects/project.schema";

const DEFAULT_BACKUP_LIMIT = 20;

export class ProjectRepositoryError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "REVISION_CONFLICT" | "INVALID_ORDER" | "PERSISTENCE_ERROR",
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ProjectRepositoryError";
  }
}

type ProjectRepositoryOptions = {
  dataFile: string;
  backupDirectory: string;
  backupLimit?: number;
  seed?: ProjectDocument;
};

export class ProjectRepository {
  private readonly dataFile: string;
  private readonly dataDirectory: string;
  private readonly backupDirectory: string;
  private readonly backupLimit: number;
  private readonly seed: ProjectDocument;
  private snapshot: ProjectDocument | undefined;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(options: ProjectRepositoryOptions) {
    this.dataFile = path.resolve(options.dataFile);
    this.dataDirectory = path.dirname(this.dataFile);
    this.backupDirectory = path.resolve(options.backupDirectory);
    this.backupLimit = options.backupLimit ?? DEFAULT_BACKUP_LIMIT;
    this.seed = projectDocumentSchema.parse(options.seed ?? seedJson);
  }

  async initialize() {
    await mkdir(this.dataDirectory, { recursive: true, mode: 0o750 });
    await mkdir(this.backupDirectory, { recursive: true, mode: 0o750 });
    await this.removeAbandonedTemporaryFiles();

    try {
      this.snapshot = await this.readDocument(this.dataFile);
      return;
    } catch (error) {
      if (isMissingFileError(error)) {
        await this.writeDocumentAtomically(this.seed);
        this.snapshot = structuredClone(this.seed);
        return;
      }
    }

    await this.quarantinePrimary();
    const recovered = await this.findNewestValidBackup();

    if (!recovered) {
      throw new ProjectRepositoryError(
        "PERSISTENCE_ERROR",
        "Project data is invalid and no valid backup is available",
      );
    }

    await this.writeDocumentAtomically(recovered);
    this.snapshot = structuredClone(recovered);
  }

  getDocument() {
    return structuredClone(this.requireSnapshot());
  }

  getPublicProjects() {
    return this.requireSnapshot()
      .projects.filter((project) => project.published)
      .sort((left, right) => left.order - right.order)
      .map((project) => structuredClone(project));
  }

  getProject(id: string) {
    const project = this.requireSnapshot().projects.find((candidate) => candidate.id === id);

    if (!project) {
      throw new ProjectRepositoryError("NOT_FOUND", `Project ${id} was not found`);
    }

    return structuredClone(project);
  }

  createProject(expectedRevision: number, input: EditableProject) {
    return this.mutate(expectedRevision, (document) => {
      const now = new Date().toISOString();
      const project: Project = {
        ...input,
        id: randomUUID(),
        order: document.projects.length,
        createdAt: now,
        updatedAt: now,
      };

      document.projects.push(project);
      return project;
    });
  }

  updateProject(expectedRevision: number, id: string, input: EditableProject) {
    return this.mutate(expectedRevision, (document) => {
      const index = document.projects.findIndex((project) => project.id === id);
      if (index === -1) {
        throw new ProjectRepositoryError("NOT_FOUND", `Project ${id} was not found`);
      }

      const existing = document.projects[index];
      const project: Project = {
        ...input,
        id: existing.id,
        order: existing.order,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
      };
      document.projects[index] = project;
      return project;
    });
  }

  deleteProject(expectedRevision: number, id: string) {
    return this.mutate(expectedRevision, (document) => {
      const index = document.projects.findIndex((project) => project.id === id);
      if (index === -1) {
        throw new ProjectRepositoryError("NOT_FOUND", `Project ${id} was not found`);
      }

      const [deleted] = document.projects.splice(index, 1);
      normalizeOrder(document.projects);
      return deleted;
    });
  }

  reorderProjects(expectedRevision: number, orderedIds: string[]) {
    return this.mutate(expectedRevision, (document) => {
      const currentIds = new Set(document.projects.map((project) => project.id));
      const nextIds = new Set(orderedIds);
      if (
        currentIds.size !== nextIds.size ||
        orderedIds.length !== nextIds.size ||
        [...currentIds].some((id) => !nextIds.has(id))
      ) {
        throw new ProjectRepositoryError(
          "INVALID_ORDER",
          "The ordered project ids must contain every project exactly once",
        );
      }

      const projectsById = new Map(document.projects.map((project) => [project.id, project]));
      document.projects = orderedIds.map((id, order) => ({
        ...projectsById.get(id)!,
        order,
        updatedAt: new Date().toISOString(),
      }));
      return structuredClone(document.projects);
    });
  }

  private mutate<T>(
    expectedRevision: number,
    change: (document: ProjectDocument) => T,
  ): Promise<{ document: ProjectDocument; value: T }> {
    return this.enqueueWrite(async () => {
      const current = this.requireSnapshot();
      if (current.revision !== expectedRevision) {
        throw new ProjectRepositoryError(
          "REVISION_CONFLICT",
          `Expected revision ${expectedRevision}, found ${current.revision}`,
        );
      }

      const next = structuredClone(current);
      const value = change(next);
      next.revision += 1;
      const validated = projectDocumentSchema.parse(next);

      await this.writeBackup(current);
      await this.writeDocumentAtomically(validated);
      this.snapshot = validated;
      await this.pruneBackups();

      return {
        document: structuredClone(validated),
        value: structuredClone(value),
      };
    });
  }

  private enqueueWrite<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.writeQueue.then(operation, operation);
    this.writeQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  private async readDocument(filePath: string) {
    const contents = await readFile(filePath, "utf8");
    return projectDocumentSchema.parse(JSON.parse(contents));
  }

  private async writeBackup(document: ProjectDocument) {
    const backupPath = path.join(
      this.backupDirectory,
      `projects.${timestampForFile()}.r${document.revision}.json`,
    );
    await this.writeFileDurably(backupPath, serializeDocument(document), true);
  }

  private async writeDocumentAtomically(document: ProjectDocument) {
    const temporaryPath = path.join(
      this.dataDirectory,
      `.${path.basename(this.dataFile)}.${randomUUID()}.tmp`,
    );

    try {
      await this.writeFileDurably(temporaryPath, serializeDocument(document), true);
      await this.readDocument(temporaryPath);
      await rename(temporaryPath, this.dataFile);
      await syncDirectory(this.dataDirectory);
    } catch (error) {
      await rm(temporaryPath, { force: true });
      throw new ProjectRepositoryError("PERSISTENCE_ERROR", "Unable to persist project data", {
        cause: error,
      });
    }
  }

  private async writeFileDurably(filePath: string, contents: string, exclusive: boolean) {
    const handle = await open(filePath, exclusive ? "wx" : "w", 0o640);
    try {
      await handle.writeFile(contents, "utf8");
      await handle.sync();
    } finally {
      await handle.close();
    }
  }

  private async quarantinePrimary() {
    const quarantinePath = `${this.dataFile}.corrupt-${timestampForFile()}`;
    await rename(this.dataFile, quarantinePath);
    await syncDirectory(this.dataDirectory);
  }

  private async findNewestValidBackup() {
    const backups = (await readdir(this.backupDirectory))
      .filter((name) => name.startsWith("projects.") && name.endsWith(".json"))
      .sort()
      .reverse();

    for (const backup of backups) {
      try {
        return await this.readDocument(path.join(this.backupDirectory, backup));
      } catch {
        // Continue until the newest schema-valid backup is found.
      }
    }

    return undefined;
  }

  private async pruneBackups() {
    const backups = (
      await Promise.all(
        (
          await readdir(this.backupDirectory)
        )
          .filter((name) => name.startsWith("projects.") && name.endsWith(".json"))
          .map(async (name) => {
            const filePath = path.join(this.backupDirectory, name);
            return { filePath, modifiedAt: (await stat(filePath)).mtimeMs };
          }),
      )
    ).sort((left, right) => right.modifiedAt - left.modifiedAt);

    await Promise.all(
      backups.slice(this.backupLimit).map(({ filePath }) => rm(filePath, { force: true })),
    );
  }

  private async removeAbandonedTemporaryFiles() {
    const prefix = `.${path.basename(this.dataFile)}.`;
    const entries = await readdir(this.dataDirectory);
    await Promise.all(
      entries
        .filter((name) => name.startsWith(prefix) && name.endsWith(".tmp"))
        .map((name) => rm(path.join(this.dataDirectory, name), { force: true })),
    );
  }

  private requireSnapshot() {
    if (!this.snapshot) {
      throw new ProjectRepositoryError(
        "PERSISTENCE_ERROR",
        "Project repository has not been initialized",
      );
    }
    return this.snapshot;
  }
}

let repositoryPromise: Promise<ProjectRepository> | undefined;

export function getProjectRepository() {
  if (!repositoryPromise) {
    const dataFile =
      process.env.PROJECT_DATA_FILE ?? path.resolve(process.cwd(), ".data/projects.json");
    const backupDirectory =
      process.env.PROJECT_BACKUP_DIR ?? path.join(path.dirname(dataFile), "backups");
    const repository = new ProjectRepository({
      dataFile,
      backupDirectory,
    });
    repositoryPromise = repository.initialize().then(() => repository);
  }

  return repositoryPromise;
}

function normalizeOrder(projects: Project[]) {
  for (const [order, project] of projects.entries()) {
    project.order = order;
  }
}

function serializeDocument(document: ProjectDocument) {
  return `${JSON.stringify(document, null, 2)}\n`;
}

function timestampForFile() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}

async function syncDirectory(directory: string) {
  const handle = await open(directory, constants.O_RDONLY);
  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}
