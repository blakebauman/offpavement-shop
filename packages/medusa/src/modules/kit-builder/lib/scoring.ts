import type { RiderPreferences, TripProfile } from "./types"

export interface ProductWithEditorial {
  id: string
  title?: string
  weight_grams?: number | null
  durability_rating?: number | null
  price_tier?: "budget" | "mid" | "premium"
  trip_type_suitability?: string[] | null
  editorial_rating?: number
  compatibility_rules?: unknown[] | null
  kit_slots?: string[]
}

export function scoreProduct(
  product: ProductWithEditorial,
  preferences: RiderPreferences,
  tripProfile: TripProfile
): number {
  let score = 0

  const weightGrams = product.weight_grams ?? Infinity
  const durabilityRating = product.durability_rating ?? 5

  if (preferences.weight_vs_durability <= 2) {
    score += weightGrams > 0 ? (1000 / weightGrams) * 10 : 0
  } else {
    score += (durabilityRating ?? 0) * 20
  }

  if (product.price_tier === preferences.budget_tier) {
    score += 30
  } else if (preferences.budget_tier === "mixed") {
    score += 10
  }

  const suitability = product.trip_type_suitability ?? []
  if (suitability.includes(tripProfile.duration)) {
    score += 25
  }

  score += (product.editorial_rating ?? 5) * 3

  return score
}
