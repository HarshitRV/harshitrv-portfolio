const SOCIAL_IMAGE = "https://harshitrv.in/og/harshit-kr-vishwakarma.png";

export function socialMeta({
  description,
  title,
  url,
  type = "website",
}: {
  description: string;
  title: string;
  url: string;
  type?: string;
}) {
  return [
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: "HarshitRV" },
    { property: "og:locale", content: "en_IN" },
    { property: "og:image", content: SOCIAL_IMAGE },
    { property: "og:image:type", content: "image/png" },
    { property: "og:image:width", content: "1200" },
    { property: "og:image:height", content: "630" },
    {
      property: "og:image:alt",
      content: "Harshit Kr Vishwakarma — Software Engineer",
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: SOCIAL_IMAGE },
    {
      name: "twitter:image:alt",
      content: "Harshit Kr Vishwakarma — Software Engineer",
    },
  ];
}

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(
    /[<>&\u2028\u2029]/g,
    (character) =>
      ({
        "<": "\\u003c",
        ">": "\\u003e",
        "&": "\\u0026",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029",
      })[character]!,
  );
}
