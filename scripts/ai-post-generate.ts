import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

// Minimal CLI parsing
const args = Object.fromEntries(
  process.argv.slice(2).reduce(
    (acc, val, i, arr) => {
      if (val.startsWith("--")) acc.push([val.replace(/^--/, ""), arr[i + 1]]);
      return acc;
    },
    [] as [string, string][],
  ),
) as any;

const slug = args.slug as string;
const section = args.section as
  | "overview"
  | "features"
  | "architecture"
  | "challenges"
  | "whats-next";
const provider = (args.provider || process.env.PROVIDER || "github") as
  | "github"
  | "openai"
  | "anthropic";
const model = (args.model || process.env.MODEL || "gpt-4o-mini") as string;

if (!slug) throw new Error("Missing --slug");
if (!section) throw new Error("Missing --section");

const MANAGED: Record<string, [string, string]> = {
  overview: [
    "<!-- managed:overview:start -->",
    "<!-- managed:overview:end -->",
  ],
  features: [
    "<!-- managed:features:start -->",
    "<!-- managed:features:end -->",
  ],
  architecture: [
    "<!-- managed:architecture:start -->",
    "<!-- managed:architecture:end -->",
  ],
  challenges: [
    "<!-- managed:challenges:start -->",
    "<!-- managed:challenges:end -->",
  ],
  "whats-next": [
    "<!-- managed:whats-next:start -->",
    "<!-- managed:whats-next:end -->",
  ],
};

type ProjectCfg = {
  owner: string;
  repo: string;
  branch?: string;
  slug: string;
  title?: string;
};
type RootCfg = {
  projects: ProjectCfg[];
  generation?: {
    tone?: string;
    target_word_count?: string | number;
    output_dir?: string;
  };
};

async function readYamlFile<T = any>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return yaml.load(raw) as T;
}

async function ghGet(pathname: string): Promise<any> {
  const url = `https://api.github.com${pathname}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: process.env.GITHUB_TOKEN
        ? `Bearer ${process.env.GITHUB_TOKEN}`
        : "",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "content-writer-action",
    },
  });
  if (res.status === 404) return undefined;
  if (!res.ok)
    throw new Error(
      `GitHub API ${res.status} ${res.statusText} for ${pathname}`,
    );
  return res.json();
}

async function fetchReadme(
  owner: string,
  repo: string,
): Promise<string | undefined> {
  const res = await ghGet(`/repos/${owner}/${repo}/readme`);
  if (!res?.content) return undefined;
  return Buffer.from(res.content, "base64").toString("utf8");
}

async function fetchCodySite(
  owner: string,
  repo: string,
): Promise<any | undefined> {
  const res = await ghGet(
    `/repos/${owner}/${repo}/contents/${encodeURIComponent(".codysite.yml")}`,
  );
  if (!res?.content) return undefined;
  return yaml.load(Buffer.from(res.content, "base64").toString("utf8"));
}

function findProject(cfg: RootCfg, slug: string): ProjectCfg {
  const p = (cfg.projects || []).find((p) => p.slug === slug);
  if (!p)
    throw new Error(`No project with slug '${slug}' in projects.config.yaml`);
  return p;
}

async function ensureFrontmatter(
  filePath: string,
  defaults: Record<string, any>,
): Promise<{ fm: Record<string, any>; body: string }> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const m = /^---\s*?\n([\s\S]*?)\n---\s*?\n?([\s\S]*)$/m.exec(raw);
    if (m) {
      const fm = yaml.load(m[1]) as Record<string, any>;
      const body = m[2] || "";
      return { fm: { ...defaults, ...fm }, body };
    }
    return { fm: defaults, body: raw };
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return { fm: defaults, body: "" };
    }
    throw e;
  }
}

function upsertManaged(
  body: string,
  key: keyof typeof MANAGED,
  content: string,
): string {
  const [start, end] = MANAGED[key];
  const block = `${start}\n${content.trim()}\n${end}`;
  if (!body.includes(start) || !body.includes(end)) {
    const prepend = body.trim().length ? `${block}\n\n${body.trim()}` : block;
    return `${prepend}\n`;
  }
  const re = new RegExp(`${start}[\\s\\S]*?${end}`);
  return body.replace(re, block);
}

function fmToString(fm: Record<string, any>): string {
  return `---\n${yaml.dump(fm)}---\n\n`;
}

function firstParagraph(md?: string) {
  if (!md) return undefined;
  const lines = md.split(/\r?\n/);
  let buf: string[] = [];
  for (const l of lines) {
    if (l.startsWith("#")) continue;
    if (l.trim() === "") {
      if (buf.length) break;
      else continue;
    }
    buf.push(l.trim());
  }
  return buf.join(" ");
}

function buildPrompt(params: {
  section: string;
  title: string;
  readme?: string;
  codysite?: any;
  tone?: string;
  targetWords?: [number, number];
}) {
  const { section, title, readme, codysite, tone, targetWords } = params;
  const min = targetWords?.[0] ?? 500;
  const max = targetWords?.[1] ?? 700;

  const audience =
    codysite?.codysite?.audience ||
    "Non-technical readers and indie developers";
  const style =
    tone ||
    "Indie hacker; professional, a bit nerdy, approachable for non-technical folks";
  const readmeFirstPara = firstParagraph(readme);
  const highlights = codysite?.codysite?.highlights || [];
  const arch = codysite?.codysite?.architecture || [];
  const challenges = codysite?.codysite?.challenges || [];
  const whatsNext = codysite?.codysite?.whats_next || [];

  let instructions = `Write the ${section} section for a project page titled "${title}". Tone: ${style}. Audience: ${audience}. Keep it concise, vivid, and skimmable. Avoid jargon. No emojis. No slang. Length target: ${min}-${max} words for overview, or 5–7 bullets for list sections.

Context (may be partial):
- README first paragraph: ${readmeFirstPara || "n/a"}
- Extra context (.codysite.yml): 
  - highlights: ${highlights.length ? highlights.join("; ") : "n/a"}
  - architecture: ${arch.length ? arch.join("; ") : "n/a"}
  - challenges: ${challenges.length ? challenges.join("; ") : "n/a"}
  - whats_next: ${whatsNext.length ? whatsNext.join("; ") : "n/a"}

Output format:
- For "overview": return 2–3 short paragraphs, not a list, no heading.
- For list sections (features, architecture, challenges, whats-next): return a clean bullet list with 5–7 items, each line concise and outcome-oriented.
- Do not include a section heading; the caller wraps it in the page.`;

  return instructions;
}

async function callLLM({
  provider,
  model,
  prompt,
}: {
  provider: "github" | "openai" | "anthropic";
  model: string;
  prompt: string;
}): Promise<string> {
  if (provider === "github") {
    // GitHub Models (chat completions)
    const resp = await fetch(
      "https://models.inference.ai.azure.com/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a concise, friendly technical writer for an indie hacker portfolio. Keep copy clear and engaging for non-technical readers.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
        }),
      },
    );
    if (!resp.ok)
      throw new Error(`GitHub Models error ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty model response");
    return text.trim();
  }

  if (provider === "openai") {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a concise, friendly technical writer for an indie hacker portfolio. Keep copy clear and engaging for non-technical readers.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });
    if (!resp.ok)
      throw new Error(`OpenAI error ${resp.status} ${resp.statusText}`);
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || "";
    if (!text) throw new Error("Empty model response");
    return text.trim();
  }

  // anthropic
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": `${process.env.ANTHROPIC_API_KEY || ""}`,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1200,
      temperature: 0.7,
      system:
        "You are a concise, friendly technical writer for an indie hacker portfolio. Keep copy clear and engaging for non-technical readers.",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!resp.ok)
    throw new Error(`Anthropic error ${resp.status} ${resp.statusText}`);
  const data = await resp.json();
  const text = data?.content?.[0]?.text || "";
  if (!text) throw new Error("Empty model response");
  return text.trim();
}

async function main() {
  const rootCfg = await readYamlFile<RootCfg>(
    path.resolve("projects.config.yaml"),
  );
  const project = findProject(rootCfg, slug);
  const repoMeta = await ghGet(`/repos/${project.owner}/${project.repo}`);
  const readme = await fetchReadme(project.owner, project.repo);
  const codysite = await fetchCodySite(project.owner, project.repo);

  const title = project.title || repoMeta?.name || slug;
  const tone =
    rootCfg.generation?.tone ||
    "Indie hacker; professional, a bit nerdy, approachable";
  const tc = rootCfg.generation?.target_word_count;
  const targetWords: [number, number] | undefined =
    typeof tc === "string" && tc.includes("-")
      ? (tc.split("-").map((n) => parseInt(n.trim(), 10)) as [number, number])
      : undefined;

  const prompt = buildPrompt({
    section,
    title,
    readme,
    codysite,
    tone,
    targetWords,
  });

  // Call selected model
  const text = await callLLM({ provider, model, prompt });

  // Paths and defaults
  const outDir = rootCfg.generation?.output_dir || "content/projects";
  const mdPath = path.resolve(outDir, `${slug}.md`);
  const defaults = {
    title,
    slug,
    description: codysite?.codysite?.description || "",
    longDescription: codysite?.codysite?.longDescription || undefined,
    tags: codysite?.codysite?.tags || [],
    githubUrl:
      repoMeta?.html_url ||
      `https://github.com/${project.owner}/${project.repo}`,
    liveDemoUrl: repoMeta?.homepage || undefined,
    timestamp: new Date().toISOString().split("T")[0],
    featured: false,
  };

  const { fm, body: existingBody } = await ensureFrontmatter(mdPath, defaults);

  // Wrap content in proper managed block formatting per sectioFiles in kuhlekt1v/portfolio:
scripts/generate-project.ts
scripts/ai-generate-section.ts
.github/workflows/generate-project-content.yml
.github/workflows/ai-generate-section.yml
projects.config.yaml (output_dir: content/projects; target_word_count: 500–700)n type
  const contentForSection =
    section === "overview"
      ? `## Overview\n${text}`
      : section === "features"
        ? `## Features\n${text}`
        : section === "architecture"
          ? `## How it’s built\n${text}`
          : section === "challenges"
            ? `## Challenges & solutions\n${text}`
            : `## What’s next\n${text}`;

  const updatedBody = upsertManaged(existingBody, section, contentForSection);

  // Ensure a Links block exists once
  let finalBody = updatedBody;
  if (!/^\s*##\s+Links\s*$/m.test(finalBody)) {
    const links = [
      fm.githubUrl ? `- Source on GitHub: ${fm.githubUrl}` : "",
      fm.liveDemoUrl ? `- Live demo: ${fm.liveDemoUrl}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    finalBody = `${finalBody.trim()}\n\n## Links\n${links}\n`;
  }

  await fs.mkdir(path.dirname(mdPath), { recursive: true });
  await fs.writeFile(mdPath, `${fmToString(fm)}${finalBody}`, "utf8");

  console.log(`Wrote ${mdPath} (${section})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
