import type { CollectionEntry } from "astro:content";

export type ProjectFrontmatter = CollectionEntry<"project">["data"] & {
  url: string;
};

