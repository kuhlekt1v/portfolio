import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";
import { parse as parseToml } from "toml";

const resume = defineCollection({
  loader: file("content/about/resume.toml", {
    parser: (text) => JSON.parse(JSON.stringify(parseToml(text))),
  }),
  schema: z.object({
    about: z.string(),
    experience: z.object({
      company: z.string(),
      title: z.string(),
      date: z.string(),
      location: z.string(),
      details: z.array(z.string()),
    }),
    educaction: z.object({
      institution: z.string(),
      degree: z.string(),
      graduationYear: z.string(),
      location: z.string(),
      honors: z.array(z.string()),
      courses: z.array(z.string()),
    }),
    certifications: z.object({
      title: z.string(),
      affiliation: z.string(),
      date: z.string(),
    }),
    skills: z.object({
      languages: z.array(z.string()),
      tools: z.array(z.string()),
      practices: z.array(z.string()),
    }),
  }),
});

export const collections = { resume };
