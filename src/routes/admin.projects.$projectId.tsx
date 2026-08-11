import { createFileRoute } from "@tanstack/react-router";
import { ProjectEditor } from "@/components/project-editor";
import { getAdminProject } from "@/server/projects/project.functions";

export const Route = createFileRoute("/admin/projects/$projectId")({
  loader: ({ params }) => getAdminProject({ data: params.projectId }),
  component: EditProjectPage,
});

function EditProjectPage() {
  const data = Route.useLoaderData();
  return <ProjectEditor initialProject={data.project} initialRevision={data.revision} />;
}
