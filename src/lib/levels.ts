// Academic levels a project can belong to. Kept in one place so the enum,
// admin forms, filters, and display labels can never drift apart.

export const PROJECT_LEVELS = [
  "UNDERGRADUATE",
  "POSTGRADUATE",
  "DIPLOMA",
  "NCE",
] as const;

export type ProjectLevel = (typeof PROJECT_LEVELS)[number];

export const PROJECT_LEVEL_LABELS: Record<ProjectLevel, string> = {
  UNDERGRADUATE: "Undergraduate",
  POSTGRADUATE: "Postgraduate",
  DIPLOMA: "Diploma",
  NCE: "NCE",
};

export function isProjectLevel(value: string | null | undefined): value is ProjectLevel {
  return PROJECT_LEVELS.includes(value as ProjectLevel);
}

export function projectLevelLabel(level: string | null | undefined): string {
  if (level && isProjectLevel(level)) return PROJECT_LEVEL_LABELS[level];
  return "Unknown level";
}