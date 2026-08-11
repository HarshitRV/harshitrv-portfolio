import { ExternalLinkIcon } from "lucide-react";
import type { Project } from "@/features/projects/project.schema";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const accentClasses = {
  violet: "border-project-violet/45 bg-project-violet/6",
  blue: "border-project-blue/45 bg-project-blue/6",
  green: "border-project-green/45 bg-project-green/6",
  red: "border-project-red/45 bg-project-red/6",
  amber: "border-project-amber/45 bg-project-amber/6",
  neutral: "border-project-neutral/45 bg-project-neutral/6",
} as const;

const accentTextClasses = {
  violet: "text-project-violet",
  blue: "text-project-blue",
  green: "text-project-green",
  red: "text-project-red",
  amber: "text-project-amber",
  neutral: "text-project-neutral",
} as const;

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Card className={cn("border-2", accentClasses[project.accent])}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className={cn(
              "text-xs font-semibold tracking-wider uppercase",
              accentTextClasses[project.accent],
            )}
          >
            {project.type}
          </p>
          {!project.published && <Badge variant="secondary">Draft preview</Badge>}
        </div>
        <CardTitle className="text-xl">{project.title}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {project.technologies.map((technology) => (
          <Badge key={technology} variant="outline">
            {technology}
          </Badge>
        ))}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        {project.demoUrl && (
          <a
            className={buttonVariants({ variant: "outline" })}
            href={project.demoUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Live project
            <ExternalLinkIcon data-icon="inline-end" />
          </a>
        )}
        <a
          className={buttonVariants({ variant: "outline" })}
          href={project.source.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          {project.source.label}
          <ExternalLinkIcon data-icon="inline-end" />
        </a>
      </CardFooter>
    </Card>
  );
}
