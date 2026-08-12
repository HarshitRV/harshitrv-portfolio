import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import seedJson from "../../../data/projects.seed.json";
import { type EditableProject, projectDocumentSchema } from "@/features/projects/project.schema";
import { ProjectRepository, ProjectRepositoryError } from "./project-repository";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe("ProjectRepository", () => {
  it("bootstraps a missing data file from the validated seed", async () => {
    const { repository, dataFile } = await createRepository();

    expect(repository.getDocument().projects).toHaveLength(9);
    expect(projectDocumentSchema.parse(JSON.parse(await readFile(dataFile, "utf8")))).toEqual(
      repository.getDocument(),
    );
  });

  it("serializes writes and rejects a stale revision", async () => {
    const { repository } = await createRepository();
    const input = editableProject();

    const first = await repository.createProject(0, input);

    await expect(repository.createProject(0, input)).rejects.toMatchObject({
      code: "REVISION_CONFLICT",
    });
    expect(first.document.revision).toBe(1);
    expect(repository.getDocument().projects).toHaveLength(10);
  });

  it("writes a backup before replacing the primary document", async () => {
    const { repository, backupDirectory } = await createRepository();

    await repository.createProject(0, editableProject());

    const backups = await readdir(backupDirectory);
    expect(backups).toHaveLength(1);
    const backup = projectDocumentSchema.parse(
      JSON.parse(await readFile(path.join(backupDirectory, backups[0]), "utf8")),
    );
    expect(backup.revision).toBe(0);
  });

  it("quarantines corrupt data and restores the newest valid backup", async () => {
    const { repository, dataFile, backupDirectory, directory } = await createRepository();
    await repository.createProject(0, editableProject());
    await writeFile(dataFile, "{ definitely not json", "utf8");

    const recoveredRepository = new ProjectRepository({
      dataFile,
      backupDirectory,
      seed: projectDocumentSchema.parse(seedJson),
    });
    await recoveredRepository.initialize();

    expect(recoveredRepository.getDocument().revision).toBe(0);
    expect((await readdir(directory)).some((name) => name.includes(".corrupt-"))).toBe(true);
  });

  it("fails recovery when no valid backup exists", async () => {
    const { dataFile, backupDirectory } = await repositoryPaths();
    await writeFile(dataFile, "{ invalid", "utf8");
    const repository = new ProjectRepository({
      dataFile,
      backupDirectory,
      seed: projectDocumentSchema.parse(seedJson),
    });

    await expect(repository.initialize()).rejects.toBeInstanceOf(ProjectRepositoryError);
  });
});

async function createRepository() {
  const paths = await repositoryPaths();
  const repository = new ProjectRepository({
    dataFile: paths.dataFile,
    backupDirectory: paths.backupDirectory,
    seed: projectDocumentSchema.parse(seedJson),
  });
  await repository.initialize();
  return { repository, ...paths };
}

async function repositoryPaths() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "harshitrv-projects-"));
  temporaryDirectories.push(directory);
  return {
    directory,
    dataFile: path.join(directory, "projects.json"),
    backupDirectory: path.join(directory, "backups"),
  };
}

function editableProject(): EditableProject {
  return {
    title: "New project",
    description: "A new project used by the repository test suite.",
    type: "web app",
    technologies: ["TypeScript"],
    source: {
      label: "GitHub",
      url: "https://github.com/HarshitRV/example",
    },
    demoUrl: null,
    accent: "violet",
    published: false,
  };
}
