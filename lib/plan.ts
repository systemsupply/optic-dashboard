// Canonical plan tiers used throughout the app.
export type Plan = 'basic' | 'pro' | 'max'

export const PLAN_LIMITS: Record<Plan, number> = { basic: 1, pro: 5, max: Infinity }
export const PLAN_LABELS: Record<Plan, string> = { basic: 'Basic', pro: 'Pro', max: 'Max' }
export const PLAN_PRICES: Record<Plan, string> = { basic: 'Free', pro: '$19/mo', max: '$49/mo' }

// Legacy/alternate plan names that should be treated as their modern equivalent.
// ('agency' was the old name for the top-tier plan, now 'max'.)
const PLAN_ALIASES: Record<string, Plan> = {
  agency: 'max',
}

// Normalizes a raw plan value from the database (which may be missing,
// differently-cased, or an old/legacy plan name) into a known Plan.
// Falls back to 'basic' if the value is unrecognized.
export function normalizePlan(rawPlan: string | null | undefined): Plan {
  const key = (rawPlan ?? '').trim().toLowerCase()
  if (key === 'basic' || key === 'pro' || key === 'max') return key
  if (key in PLAN_ALIASES) return PLAN_ALIASES[key]
  return 'basic'
}
