import { ArrowDownIcon, ArrowUpIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Project } from "@/features/projects/project.schema";
import type { AppError } from "@/lib/app-error";
import {
  deleteProject,
  listAdminProjects,
  reorderProjects,
} from "@/server/projects/project.functions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

export const Route = createFileRoute("/admin/projects/")({
  loader: () => listAdminProjects(),
  component: ProjectListPage,
});

function ProjectListPage() {
  const loadedDocument = Route.useLoaderData();
  const router = useRouter();
  const [projects, setProjects] = useState(loadedDocument.projects);
  const [revision, setRevision] = useState(loadedDocument.revision);
  const [error, setError] = useState<AppError>();
  const [pendingId, setPendingId] = useState<string>();

  useEffect(() => {
    setProjects(loadedDocument.projects);
    setRevision(loadedDocument.revision);
  }, [loadedDocument]);

  async function moveProject(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= projects.length) return;

    const next = [...projects];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const project = projects[index];
    setPendingId(project.id);
    setError(undefined);

    try {
      const result = await reorderProjects({
        data: {
          expectedRevision: revision,
          orderedIds: next.map(({ id }) => id),
        },
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setProjects(result.data.projects);
      setRevision(result.data.revision);
      toast.add({
        title: "Project moved",
        description: `${project.title} is now position ${targetIndex + 1}.`,
        type: "success",
      });
    } finally {
      setPendingId(undefined);
    }
  }

  async function handleDelete(project: Project) {
    setPendingId(project.id);
    setError(undefined);
    try {
      const result = await deleteProject({
        data: { expectedRevision: revision, id: project.id },
      });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
      setProjects((current) =>
        current
          .filter(({ id }) => id !== result.data.deletedId)
          .map((item, order) => ({ ...item, order })),
      );
      setRevision(result.data.revision);
      toast.add({
        title: "Project deleted",
        description: `${project.title} was removed.`,
        type: "success",
      });
      return true;
    } finally {
      setPendingId(undefined);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage the projects rendered on your public portfolio.
          </p>
        </div>
        <Link className={buttonVariants()} to="/admin/projects/new">
          <PlusIcon data-icon="inline-start" />
          New project
        </Link>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error.code.replaceAll("_", " ")}</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {error.message}
            {error.code === "REVISION_CONFLICT" && (
              <Button size="sm" type="button" variant="outline" onClick={() => router.invalidate()}>
                Reload latest data
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {projects.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>Create the first project for your portfolio.</EmptyDescription>
          </EmptyHeader>
          <Link className={buttonVariants()} to="/admin/projects/new">
            <PlusIcon data-icon="inline-start" />
            Create the first project
          </Link>
        </Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Order</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Accent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project, index) => (
                <TableRow key={project.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <p className="font-medium">{project.title}</p>
                    <p className="text-xs text-muted-foreground">{project.type}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={project.published ? "default" : "secondary"}>
                      {project.published ? "Live" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{project.accent}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        aria-label={`Move ${project.title} up`}
                        disabled={index === 0 || pendingId === project.id}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                        onClick={() => moveProject(index, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        aria-label={`Move ${project.title} down`}
                        disabled={index === projects.length - 1 || pendingId === project.id}
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                        onClick={() => moveProject(index, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                      <Link
                        aria-label={`Edit ${project.title}`}
                        className={buttonVariants({
                          size: "icon-sm",
                          variant: "ghost",
                        })}
                        params={{ projectId: project.id }}
                        to="/admin/projects/$projectId"
                      >
                        <PencilIcon />
                      </Link>
                      <DeleteProjectDialog
                        disabled={pendingId === project.id}
                        project={project}
                        onDelete={handleDelete}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function DeleteProjectDialog({
  disabled,
  project,
  onDelete,
}: {
  disabled: boolean;
  project: Project;
  onDelete: (project: Project) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);

  async function deleteAndClose() {
    if (await onDelete(project)) {
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            aria-label={`Delete ${project.title}`}
            disabled={disabled}
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <Trash2Icon />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {project.title}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the project. Recovery requires restoring a data backup.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={deleteAndClose}>
            Delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
