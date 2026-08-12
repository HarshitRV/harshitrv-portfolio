import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  type EditableProject,
  type Project,
  editableProjectSchema,
  projectAccentSchema,
} from "@/features/projects/project.schema";
import type { AppError } from "@/lib/app-error";
import { createProject, updateProject } from "@/server/projects/project.functions";
import { ProjectCard } from "@/components/project-card";
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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";

const accentItems = projectAccentSchema.options.map((value) => ({
  label: value[0].toUpperCase() + value.slice(1),
  value,
}));

type ProjectForm = Omit<EditableProject, "demoUrl"> & {
  demoUrl: string;
};

const emptyProject: ProjectForm = {
  title: "",
  description: "",
  type: "",
  technologies: [""],
  source: { label: "GitHub", url: "" },
  demoUrl: "",
  accent: "violet",
  published: false,
};

export function ProjectEditor({
  initialProject,
  initialRevision,
}: {
  initialProject?: Project;
  initialRevision: number;
}) {
  const [form, setForm] = useState<ProjectForm>(() =>
    initialProject
      ? {
          title: initialProject.title,
          description: initialProject.description,
          type: initialProject.type,
          technologies: initialProject.technologies,
          source: initialProject.source,
          demoUrl: initialProject.demoUrl ?? "",
          accent: initialProject.accent,
          published: initialProject.published,
        }
      : emptyProject,
  );
  const [revision, setRevision] = useState(initialRevision);
  const [error, setError] = useState<AppError>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);
  const [dirty, setDirty] = useState(false);
  const dirtyRef = useRef(false);

  useEffect(() => {
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      if (dirtyRef.current) event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, []);

  const preview = useMemo<Project>(
    () => ({
      ...form,
      demoUrl: form.demoUrl || null,
      id: initialProject?.id ?? "00000000-0000-4000-8000-000000000000",
      order: initialProject?.order ?? 0,
      createdAt: initialProject?.createdAt ?? new Date(0).toISOString(),
      updatedAt: initialProject?.updatedAt ?? new Date(0).toISOString(),
      title: form.title || "Project title",
      description: form.description || "Your project description will appear here.",
      type: form.type || "project type",
      technologies: form.technologies.filter(Boolean).length
        ? form.technologies.filter(Boolean)
        : ["Technology"],
      source: {
        label: form.source.label || "Source",
        url: form.source.url || "https://example.com",
      },
    }),
    [form, initialProject],
  );

  function updateForm(update: (current: ProjectForm) => ProjectForm) {
    setForm(update);
    dirtyRef.current = true;
    setDirty(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});

    const parsed = editableProjectSchema.safeParse({
      ...form,
      demoUrl: form.demoUrl.trim() || null,
    });
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      setFieldErrors(flattened.fieldErrors as Record<string, string[]>);
      setError({
        code: "VALIDATION_ERROR",
        message: "Check the highlighted fields and try again.",
        requestId: "client-validation",
      });
      return;
    }

    setPending(true);
    try {
      const result = initialProject
        ? await updateProject({
            data: {
              expectedRevision: revision,
              id: initialProject.id,
              project: parsed.data,
            },
          })
        : await createProject({
            data: {
              expectedRevision: revision,
              project: parsed.data,
            },
          });

      if (!result.ok) {
        setError(result.error);
        setFieldErrors(result.error.fieldErrors ?? {});
        return;
      }

      setRevision(result.data.revision);
      dirtyRef.current = false;
      setDirty(false);
      toast.add({
        title: initialProject ? "Project saved" : "Project created",
        description: `${result.data.project.title} is up to date.`,
        type: "success",
      });

      if (!initialProject) {
        window.location.assign(`/admin/projects/${encodeURIComponent(result.data.project.id)}`);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link className="text-sm text-muted-foreground hover:text-foreground" to="/admin/projects">
          ← Projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {initialProject ? `Edit ${form.title || "project"}` : "New project"}
        </h1>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{error.code.replaceAll("_", " ")}</AlertTitle>
          <AlertDescription>
            {error.message}
            {error.requestId !== "client-validation" && (
              <span className="mt-1 block text-xs">Request: {error.requestId}</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Project details</CardTitle>
            <CardDescription>All content is validated before it can be published.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="project-form" onSubmit={handleSubmit}>
              <FieldGroup>
                <TextField
                  error={fieldErrors.title?.[0]}
                  id="title"
                  label="Title"
                  maxLength={120}
                  value={form.title}
                  onChange={(title) => updateForm((current) => ({ ...current, title }))}
                />
                <Field data-invalid={Boolean(fieldErrors.description)}>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    aria-invalid={Boolean(fieldErrors.description)}
                    id="description"
                    maxLength={600}
                    rows={5}
                    value={form.description}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                  <FieldDescription>{form.description.length}/600 characters</FieldDescription>
                  <FieldError>{fieldErrors.description?.[0]}</FieldError>
                </Field>
                <TextField
                  error={fieldErrors.type?.[0]}
                  id="type"
                  label="Type"
                  maxLength={80}
                  placeholder="Web app"
                  value={form.type}
                  onChange={(type) => updateForm((current) => ({ ...current, type }))}
                />

                <FieldSet>
                  <FieldLegend>Technologies</FieldLegend>
                  <FieldDescription>Add each technology separately.</FieldDescription>
                  <FieldGroup>
                    {form.technologies.map((technology, index) => (
                      <Field
                        data-invalid={Boolean(fieldErrors.technologies)}
                        orientation="horizontal"
                        key={index}
                      >
                        <Input
                          aria-label={`Technology ${index + 1}`}
                          aria-invalid={Boolean(fieldErrors.technologies)}
                          maxLength={40}
                          value={technology}
                          onChange={(event) =>
                            updateForm((current) => ({
                              ...current,
                              technologies: current.technologies.map((item, itemIndex) =>
                                itemIndex === index ? event.target.value : item,
                              ),
                            }))
                          }
                        />
                        <Button
                          aria-label={`Remove technology ${index + 1}`}
                          disabled={form.technologies.length === 1}
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            updateForm((current) => ({
                              ...current,
                              technologies: current.technologies.filter(
                                (_, itemIndex) => itemIndex !== index,
                              ),
                            }))
                          }
                        >
                          <Trash2Icon />
                        </Button>
                      </Field>
                    ))}
                    <FieldError>{fieldErrors.technologies?.[0]}</FieldError>
                    <Button
                      disabled={form.technologies.length >= 20}
                      type="button"
                      variant="outline"
                      onClick={() =>
                        updateForm((current) => ({
                          ...current,
                          technologies: [...current.technologies, ""],
                        }))
                      }
                    >
                      <PlusIcon data-icon="inline-start" />
                      Add technology
                    </Button>
                  </FieldGroup>
                </FieldSet>

                <FieldSet>
                  <FieldLegend>Links</FieldLegend>
                  <FieldGroup>
                    <TextField
                      id="source-label"
                      label="Source label"
                      maxLength={40}
                      value={form.source.label}
                      onChange={(label) =>
                        updateForm((current) => ({
                          ...current,
                          source: { ...current.source, label },
                        }))
                      }
                    />
                    <TextField
                      id="source-url"
                      label="Source URL"
                      placeholder="https://github.com/…"
                      type="url"
                      value={form.source.url}
                      onChange={(url) =>
                        updateForm((current) => ({
                          ...current,
                          source: { ...current.source, url },
                        }))
                      }
                    />
                    <TextField
                      id="demo-url"
                      label="Demo URL"
                      placeholder="Optional HTTPS URL"
                      type="url"
                      value={form.demoUrl}
                      onChange={(demoUrl) => updateForm((current) => ({ ...current, demoUrl }))}
                    />
                  </FieldGroup>
                </FieldSet>

                <Field>
                  <FieldLabel>Accent</FieldLabel>
                  <Select
                    items={accentItems}
                    value={form.accent}
                    onValueChange={(accent) =>
                      accent &&
                      updateForm((current) => ({
                        ...current,
                        accent,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {accentItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </Field>

                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldLabel htmlFor="published">Published</FieldLabel>
                    <FieldDescription>Show this project on the public portfolio.</FieldDescription>
                  </FieldContent>
                  <Switch
                    checked={form.published}
                    id="published"
                    onCheckedChange={(published) =>
                      updateForm((current) => ({ ...current, published }))
                    }
                  />
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
          <CardFooter className="flex justify-between gap-3">
            {dirty ? (
              <DiscardChangesDialog />
            ) : (
              <Link className={buttonVariants({ variant: "outline" })} to="/admin/projects">
                Cancel
              </Link>
            )}
            <Button disabled={pending} form="project-form" type="submit">
              {pending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              Save project
            </Button>
          </CardFooter>
        </Card>

        <div className="flex flex-col gap-3 lg:sticky lg:top-6">
          <p className="text-sm font-medium text-muted-foreground">Live preview</p>
          <ProjectCard project={preview} />
        </div>
      </div>
    </div>
  );
}

function TextField({
  error,
  id,
  label,
  onChange,
  ...props
}: {
  error?: string;
  id: string;
  label: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "aria-invalid" | "id" | "onChange">) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        {...props}
        aria-invalid={Boolean(error)}
        id={id}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError>{error}</FieldError>
    </Field>
  );
}

function DiscardChangesDialog() {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button type="button" variant="outline" />}>
        Cancel
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
          <AlertDialogDescription>Changes made on this page will be lost.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => window.location.assign("/admin/projects")}
          >
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
