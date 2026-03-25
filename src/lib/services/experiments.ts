import { db } from "@/lib/db";

export type ExperimentName =
  | "overdue_cooldown"
  | "stale_reminder_timing"
  | "due_soon_window";

export type Variant = "control" | "variant_a" | "variant_b";

interface ExperimentConfig {
  variants: Variant[];
}

const EXPERIMENTS: Record<ExperimentName, ExperimentConfig> = {
  overdue_cooldown: {
    variants: ["control", "variant_a", "variant_b"],
    // control: 12h, variant_a: 6h, variant_b: 24h
  },
  stale_reminder_timing: {
    variants: ["control", "variant_a"],
    // control: 48h, variant_a: 24h
  },
  due_soon_window: {
    variants: ["control", "variant_a"],
    // control: 1h+24h, variant_a: 2h+12h
  },
};

// Get or assign variant for user
export async function getVariant(
  userId: string,
  experiment: ExperimentName
): Promise<Variant> {
  const existing = await db.experimentAssignment.findUnique({
    where: { userId_experimentName: { userId, experimentName: experiment } },
  });

  if (existing) return existing.variant as Variant;

  // Deterministic assignment based on userId hash
  const config = EXPERIMENTS[experiment];
  const hash = simpleHash(userId + experiment);
  const variant = config.variants[hash % config.variants.length];

  await db.experimentAssignment.create({
    data: { userId, experimentName: experiment, variant },
  });

  return variant;
}

// Get experiment parameter values
export function getExperimentValue(
  experiment: ExperimentName,
  variant: Variant
): number {
  const values: Record<string, Record<string, number>> = {
    overdue_cooldown: { control: 12, variant_a: 6, variant_b: 24 }, // hours
    stale_reminder_timing: { control: 48, variant_a: 24 }, // hours
    due_soon_window: { control: 1, variant_a: 2 }, // hours for first reminder
  };

  return values[experiment]?.[variant] ?? values[experiment]?.control ?? 12;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}
