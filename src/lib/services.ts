export const SERVICE_TYPES = [
  "FINAL_YEAR_PROJECT",
  "WEBSITE",
  "APPLICATION",
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  FINAL_YEAR_PROJECT: "Final Year Project Writing",
  WEBSITE: "Website Development",
  APPLICATION: "Application Development",
};

export function isServiceType(v: string | null | undefined): v is ServiceType {
  return SERVICE_TYPES.includes(v as ServiceType);
}

export const SERVICE_BUDGET_OPTIONS = [
  "Under ₦50,000",
  "₦50,000 – ₦100,000",
  "₦100,000 – ₦200,000",
  "₦200,000 – ₦500,000",
  "Above ₦500,000",
  "Not sure yet",
] as const;