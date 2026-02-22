import type { BikeProfile, CompatibilityRule } from "./types"

export type CompatibilityResult =
  | { status: "compatible" }
  | { status: "incompatible"; message: string }
  | { status: "warning"; message: string }

function matchValue(
  profileValue: unknown,
  ruleValue: unknown,
  operator: "eq" | "in" | "not_in"
): boolean {
  switch (operator) {
    case "eq":
      return profileValue === ruleValue
    case "in":
      return Array.isArray(ruleValue) && ruleValue.includes(profileValue)
    case "not_in":
      return Array.isArray(ruleValue) && !ruleValue.includes(profileValue)
    default:
      return false
  }
}

export function evaluateCompatibility(
  product: { compatibility_rules?: CompatibilityRule[] | null },
  profile: BikeProfile
): CompatibilityResult {
  const rules = product.compatibility_rules ?? []
  for (const rule of rules) {
    const profileValue = profile[rule.attribute]
    const matches = matchValue(profileValue, rule.value, rule.operator)

    if (rule.type === "excludes" && matches) {
      return {
        status: "incompatible",
        message:
          rule.message ??
          `Incompatible with your bike profile (${String(rule.attribute)})`,
      }
    }
    if (rule.type === "requires" && !matches) {
      return {
        status: "incompatible",
        message:
          rule.message ??
          `Requires different bike profile (${String(rule.attribute)})`,
      }
    }
    if (rule.type === "warns" && matches) {
      return {
        status: "warning",
        message: rule.message ?? "Consider compatibility with your setup",
      }
    }
  }
  return { status: "compatible" }
}
