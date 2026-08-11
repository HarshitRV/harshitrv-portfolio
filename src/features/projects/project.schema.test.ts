import { describe, expect, it } from "vitest";
import seed from "../../../data/projects.seed.json";
import { editableProjectSchema, projectDocumentSchema } from "./project.schema";

describe("project schemas", () => {
  it("accepts the curated migration seed", () => {
    const document = projectDocumentSchema.parse(seed);

    expect(document.schemaVersion).toBe(1);
    expect(document.projects).toHaveLength(9);
  });

  it("rejects arbitrary project fields", () => {
    const result = editableProjectSchema.safeParse({
      ...editableSeedProject(),
      style: { border: "2px solid red" },
    });

    expect(result.success).toBe(false);
  });

  it("requires HTTPS project URLs", () => {
    const editable = editableSeedProject();
    const result = editableProjectSchema.safeParse({
      ...editable,
      source: {
        ...(editable.source as Record<string, unknown>),
        url: "http://example.com/project",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate technologies", () => {
    const result = editableProjectSchema.safeParse({
      ...editableSeedProject(),
      technologies: ["React", "React"],
    });

    expect(result.success).toBe(false);
  });

  it("requires contiguous project order", () => {
    const result = projectDocumentSchema.safeParse({
      ...seed,
      projects: seed.projects.map((project, index) => ({
        ...project,
        order: index + 1,
      })),
    });

    expect(result.success).toBe(false);
  });
});

function editableSeedProject() {
  const project = structuredClone(seed.projects[0]) as Record<string, unknown>;
  delete project.id;
  delete project.order;
  delete project.createdAt;
  delete project.updatedAt;
  return project;
}
