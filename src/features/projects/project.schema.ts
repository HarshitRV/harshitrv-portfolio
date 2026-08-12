import { z } from "zod";

const trimmedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum);

const httpsUrl = z
  .url()
  .refine((value) => new URL(value).protocol === "https:", "Use an HTTPS URL");

export const projectAccentSchema = z.enum(["violet", "blue", "green", "red", "amber", "neutral"]);

export const editableProjectSchema = z.strictObject({
  title: trimmedText(1, 120),
  description: trimmedText(1, 600),
  type: trimmedText(1, 80),
  technologies: z
    .array(trimmedText(1, 40))
    .min(1)
    .max(20)
    .transform((values, context) => {
      const uniqueValues = [...new Set(values)];

      if (uniqueValues.length !== values.length) {
        context.addIssue({
          code: "custom",
          message: "Technologies must be unique",
        });
      }

      return uniqueValues;
    }),
  source: z.strictObject({
    label: trimmedText(1, 40),
    url: httpsUrl,
  }),
  demoUrl: httpsUrl.nullable(),
  accent: projectAccentSchema,
  published: z.boolean(),
});

export const projectSchema = editableProjectSchema.extend({
  id: z.uuid(),
  order: z.int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const projectDocumentSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    revision: z.int().nonnegative(),
    projects: z.array(projectSchema).max(250),
  })
  .superRefine((document, context) => {
    const ids = new Set<string>();
    const orders = new Set<number>();

    for (const [index, project] of document.projects.entries()) {
      if (ids.has(project.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate project id: ${project.id}`,
          path: ["projects", index, "id"],
        });
      }
      ids.add(project.id);

      if (orders.has(project.order)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate project order: ${project.order}`,
          path: ["projects", index, "order"],
        });
      }
      orders.add(project.order);
    }

    const expectedOrders = document.projects.map((_, index) => index);
    const actualOrders = [...orders].sort((left, right) => left - right);
    if (
      expectedOrders.length !== actualOrders.length ||
      expectedOrders.some((order, index) => order !== actualOrders[index])
    ) {
      context.addIssue({
        code: "custom",
        message: "Project order must be contiguous from zero",
        path: ["projects"],
      });
    }
  });

export const projectIdSchema = z.uuid();

export const createProjectInputSchema = z.strictObject({
  expectedRevision: z.int().nonnegative(),
  project: editableProjectSchema,
});

export const updateProjectInputSchema = z.strictObject({
  expectedRevision: z.int().nonnegative(),
  id: projectIdSchema,
  project: editableProjectSchema,
});

export const deleteProjectInputSchema = z.strictObject({
  expectedRevision: z.int().nonnegative(),
  id: projectIdSchema,
});

export const reorderProjectsInputSchema = z.strictObject({
  expectedRevision: z.int().nonnegative(),
  orderedIds: z.array(projectIdSchema).max(250),
});

export type ProjectAccent = z.infer<typeof projectAccentSchema>;
export type EditableProject = z.infer<typeof editableProjectSchema>;
export type Project = z.infer<typeof projectSchema>;
export type ProjectDocument = z.infer<typeof projectDocumentSchema>;
