export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export type PostMeta = {
  slug: string;
  title: string;
  date: string;
  author: string;
  topic: string;
  summary: string;
  difficulty?: Difficulty;
  series?: string;
  seriesPart?: number;
};

export function formatDate(date: string): string {
  const parsed = new Date(date);
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}
