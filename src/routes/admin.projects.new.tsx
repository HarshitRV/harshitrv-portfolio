import { createFileRoute } from "@tanstack/react-router";
import { ProjectEditor } from "@/components/project-editor";
import { listAdminProjects } from "@/server/projects/project.functions";

export const Route = createFileRoute("/admin/projects/new")({
  loader: () => listAdminProjects(),
  component: NewProjectPage,
});

function NewProjectPage() {
  const document = Route.useLoaderData();
  return <ProjectEditor initialRevision={document.revision} />;
}
