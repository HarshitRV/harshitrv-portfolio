import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "@/components/home-content";
import { PublicShell } from "@/components/public-shell";
import { serializeJsonLd, socialMeta } from "@/lib/seo";

const title = "Harshit Kr Vishwakarma — Software Engineer";
const description =
  "Software engineer building reliable web experiences with React, Node.js, and TypeScript. Explore skills, education, and selected projects.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      ...socialMeta({
        title,
        description,
        type: "profile",
        url: "https://harshitrv.in/",
      }),
    ],
    links: [{ rel: "canonical", href: "https://harshitrv.in/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: serializeJsonLd({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://harshitrv.in/#website",
              name: "HarshitRV",
              url: "https://harshitrv.in/",
              publisher: { "@id": "https://harshitrv.in/#person" },
            },
            {
              "@type": "Person",
              "@id": "https://harshitrv.in/#person",
              name: "Harshit Kr Vishwakarma",
              url: "https://harshitrv.in/",
              image: "https://harshitrv.in/harshit-profile.jpeg",
              jobTitle: "Software Engineer",
              worksFor: {
                "@type": "Organization",
                name: "Genesys",
                url: "https://www.genesys.com/",
              },
              alumniOf: {
                "@type": "CollegeOrUniversity",
                name: "Vellore Institute of Technology",
                url: "https://vit.ac.in/",
              },
              sameAs: [
                "https://github.com/harshitrv",
                "https://twitter.com/hrv_vishwakarma",
                "https://www.linkedin.com/in/harshitrv",
              ],
            },
          ],
        }),
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <PublicShell>
      <HomeContent />
    </PublicShell>
  );
}
