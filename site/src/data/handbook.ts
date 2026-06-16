// The handbook's table of contents — the single source for the chapter list, the
// TOC sidebar, and prev/next pagination. Chapters live at /handbook/<slug>.
// Order: the problem → the bet → what it demands → the actors → the artifact →
// walk the lifecycle → adopt.
export interface HBChapter {
  slug: string;
  num: string;
  title: string;
  /** the one-line problem the chapter answers, shown in the TOC + cover */
  hook: string;
}

export const CHAPTERS: HBChapter[] = [
  { slug: "the-problem", num: "01", title: "Agents fill the gaps you didn't", hook: "Limited context, confident guesses — and a plan that lives apart from the code." },
  { slug: "specs-in-the-codebase", num: "02", title: "The spec lives in the codebase", hook: "Not in a task tracker. Why that's the whole bet." },
  { slug: "why-consistency", num: "03", title: "Why it has to be consistent", hook: "What the bet demands: one shape, a checker, an assistant." },
  { slug: "four-actors", num: "04", title: "Four actors, one line", hook: "Who writes, who builds, who reviews, who decides." },
  { slug: "anatomy", num: "05", title: "Anatomy of a spec", hook: "Every section, and what it's for — to each actor." },
  { slug: "shaping", num: "06", title: "Shaping: writing the contract", hook: "How a want becomes something a stranger can build." },
  { slug: "building", num: "07", title: "Building: the implementer and the goal", hook: "Equipped with the code's standards, it builds until the goal is met." },
  { slug: "review", num: "08", title: "Review, then accept", hook: "An outside agent checks the interpretation; you make the final call." },
  { slug: "graduate", num: "09", title: "Shipped work becomes memory", hook: "The spec graduates into the repo; the contract is frozen." },
  { slug: "start-light", num: "10", title: "Start light", hook: "You don't adopt all of it at once." },
];

export function chapterNav(slug: string): { index: number; prev: HBChapter | null; next: HBChapter | null } {
  const index = CHAPTERS.findIndex((c) => c.slug === slug);
  return {
    index,
    prev: index > 0 ? CHAPTERS[index - 1]! : null,
    next: index >= 0 && index < CHAPTERS.length - 1 ? CHAPTERS[index + 1]! : null,
  };
}
