import { createServerFn } from "@tanstack/react-start";
import {
  createProjectInputSchema,
  deleteProjectInputSchema,
  projectIdSchema,
  reorderProjectsInputSchema,
  updateProjectInputSchema,
} from "@/features/projects/project.schema";
import type { ActionResult } from "@/lib/app-error";
import { authMiddleware } from "@/server/auth/auth.middleware";

export const listPublicProjects = createServerFn({ method: "GET" }).handler(async () => {
  const repository = await projectRepository();
  return repository.getPublicProjects();
});

export const listAdminProjects = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async () => {
    const repository = await projectRepository();
    return repository.getDocument();
  });

export const getAdminProject = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator(projectIdSchema)
  .handler(async ({ data }) => {
    const repository = await projectRepository();
    return {
      revision: repository.getDocument().revision,
      project: repository.getProject(data),
    };
  });

export const createProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(createProjectInputSchema)
  .handler(async ({ data }): Promise<ActionResult<AwaitedMutation>> => {
    try {
      const repository = await projectRepository();
      const result = await repository.createProject(data.expectedRevision, data.project);
      return {
        ok: true,
        data: {
          revision: result.document.revision,
          project: result.value,
        },
      };
    } catch (error) {
      return actionError(error);
    }
  });

export const updateProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(updateProjectInputSchema)
  .handler(async ({ data }): Promise<ActionResult<AwaitedMutation>> => {
    try {
      const repository = await projectRepository();
      const result = await repository.updateProject(data.expectedRevision, data.id, data.project);
      return {
        ok: true,
        data: {
          revision: result.document.revision,
          project: result.value,
        },
      };
    } catch (error) {
      return actionError(error);
    }
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(deleteProjectInputSchema)
  .handler(async ({ data }): Promise<ActionResult<{ revision: number; deletedId: string }>> => {
    try {
      const repository = await projectRepository();
      const result = await repository.deleteProject(data.expectedRevision, data.id);
      return {
        ok: true,
        data: {
          revision: result.document.revision,
          deletedId: result.value.id,
        },
      };
    } catch (error) {
      return actionError(error);
    }
  });

export const reorderProjects = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(reorderProjectsInputSchema)
  .handler(
    async ({
      data,
    }): Promise<ActionResult<{ revision: number; projects: AwaitedMutation["project"][] }>> => {
      try {
        const repository = await projectRepository();
        const result = await repository.reorderProjects(data.expectedRevision, data.orderedIds);
        return {
          ok: true,
          data: {
            revision: result.document.revision,
            projects: result.value,
          },
        };
      } catch (error) {
        return actionError(error);
      }
    },
  );

type AwaitedMutation = {
  revision: number;
  project: Awaited<ReturnType<Awaited<ReturnType<typeof projectRepository>>["getProject"]>>;
};

async function projectRepository() {
  const { getProjectRepository } = await import("./project-repository");
  return getProjectRepository();
}

async function actionError(error: unknown) {
  const { toAppError } = await import("../errors.server");
  return { ok: false as const, error: toAppError(error) };
}
