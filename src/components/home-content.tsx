import { Badge } from "@/components/ui/badge";

const skills = [
  "TypeScript",
  "React",
  "Node.js",
  "Next.js",
  "Express.js",
  "SQL",
  "MongoDB",
  "Ember.js",
  "Java",
  "Python",
  "Flask",
  "Solidity",
];

const education = [
  {
    degree: "Master of Computer Application",
    school: "Vellore Institute of Technology, Vellore",
    duration: "2022 – 2024",
  },
  {
    degree: "Bachelor of Computer Application",
    school: "School of Management Sciences, Varanasi · Mahatma Gandhi Kashi Vidyapith University",
    duration: "2019 – 2022",
  },
];

export function HomeContent() {
  return (
    <div className="flex flex-col gap-12">
      <section className="grid items-center gap-7 sm:grid-cols-[7rem_1fr]">
        <img
          alt="Harshit Kr Vishwakarma"
          className="size-28 rounded-2xl object-cover ring-1 ring-border"
          height={112}
          src="/harshit-profile.jpeg"
          width={112}
        />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Hi, I&apos;m Harshit Kr Vishwakarma.
          </h1>
          <p className="max-w-2xl leading-7 text-muted-foreground">
            Software Engineer at{" "}
            <a
              className="font-medium text-primary underline-offset-4 hover:underline"
              href="https://www.linkedin.com/company/genesys/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Genesys
            </a>
            . I completed my Master&apos;s in Computer Applications from VIT Vellore with a 9.1
            CGPA.
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="skills-heading">
        <SectionHeading id="skills-heading">Skills</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Badge key={skill} variant="secondary">
              {skill}
            </Badge>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-5" aria-labelledby="education-heading">
        <SectionHeading id="education-heading">Education</SectionHeading>
        <div className="flex flex-col gap-6">
          {education.map((item) => (
            <article className="flex flex-col gap-1" key={item.degree}>
              <h3 className="font-semibold">{item.degree}</h3>
              <p className="text-sm text-muted-foreground">{item.school}</p>
              <p className="text-sm text-muted-foreground">{item.duration}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeading({ children, id }: { children: string; id: string }) {
  return (
    <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase" id={id}>
      {children}
    </h2>
  );
}
