import { createFileRoute } from "@tanstack/react-router";
import { ProjectCard } from "@/components/project-card";
import { PublicShell } from "@/components/public-shell";
import { serializeJsonLd, socialMeta } from "@/lib/seo";
import { listPublicProjects } from "@/server/projects/project.functions";

const title = "Projects — Harshit Kr Vishwakarma";
const description =
  "Selected web applications, open-source packages, and experiments built by software engineer Harshit Kr Vishwakarma.";

export const Route = createFileRoute("/portfolio")({
  loader: () => listPublicProjects(),
  head: ({ loaderData }) => ({
    meta: [
      { title },
      { name: "description", content: description },
      ...socialMeta({
        title,
        description,
        url: "https://harshitrv.in/portfolio",
      }),
    ],
    links: [{ rel: "canonical", href: "https://harshitrv.in/portfolio" }],
    scripts: [
      {
        type: "application/ld+json",
        children: serializeJsonLd({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description,
          url: "https://harshitrv.in/portfolio",
          mainEntity: {
            "@type": "ItemList",
            itemListElement: (loaderData ?? []).map((project, index) => ({
              "@type": "ListItem",
              position: index + 1,
              item: {
                "@type": "SoftwareSourceCode",
                name: project.title,
                description: project.description,
                codeRepository: project.source.url,
                url: project.demoUrl ?? project.source.url,
                programmingLanguage: project.technologies,
              },
            })),
          },
        }),
      },
    ],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const projects = Route.useLoaderData();

  return (
    <PublicShell>
      <div className="flex flex-col gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </PublicShell>
  );
}
