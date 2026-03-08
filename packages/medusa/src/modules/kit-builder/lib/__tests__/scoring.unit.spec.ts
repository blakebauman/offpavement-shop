import { scoreProduct } from "../scoring"
import type { ProductWithEditorial } from "../scoring"
import type { RiderPreferences, TripProfile } from "../types"

describe("scoreProduct", () => {
  const tripProfile: TripProfile = {
    duration: "weekend",
    terrain: "gravel",
    resupply: "self_sufficient",
  }

  it("weights lighter products higher when weight_vs_durability <= 2", () => {
    const preferences: RiderPreferences = {
      weight_vs_durability: 1,
      budget_tier: "mid",
      existing_gear: [],
    }
    const light = {
      id: "1",
      weight_grams: 200,
      durability_rating: 5,
      editorial_rating: 5,
    } as ProductWithEditorial
    const heavy = {
      id: "2",
      weight_grams: 800,
      durability_rating: 5,
      editorial_rating: 5,
    } as ProductWithEditorial
    expect(scoreProduct(light, preferences, tripProfile)).toBeGreaterThan(
      scoreProduct(heavy, preferences, tripProfile)
    )
  })

  it("weights durability higher when weight_vs_durability > 2", () => {
    const preferences: RiderPreferences = {
      weight_vs_durability: 4,
      budget_tier: "mid",
      existing_gear: [],
    }
    const durable = {
      id: "1",
      weight_grams: 500,
      durability_rating: 9,
      editorial_rating: 5,
    } as ProductWithEditorial
    const fragile = {
      id: "2",
      weight_grams: 500,
      durability_rating: 4,
      editorial_rating: 5,
    } as ProductWithEditorial
    expect(scoreProduct(durable, preferences, tripProfile)).toBeGreaterThan(
      scoreProduct(fragile, preferences, tripProfile)
    )
  })

  it("adds bonus when price_tier matches budget_tier", () => {
    const prefs: RiderPreferences = {
      weight_vs_durability: 3,
      budget_tier: "premium",
      existing_gear: [],
    }
    const matching = {
      id: "1",
      price_tier: "premium" as const,
      editorial_rating: 5,
    } as ProductWithEditorial
    const nonMatching = {
      id: "2",
      price_tier: "budget" as const,
      editorial_rating: 5,
    } as ProductWithEditorial
    expect(scoreProduct(matching, prefs, tripProfile)).toBeGreaterThan(
      scoreProduct(nonMatching, prefs, tripProfile)
    )
  })

  it("adds bonus when trip_type_suitability includes trip duration", () => {
    const prefs: RiderPreferences = {
      weight_vs_durability: 3,
      budget_tier: "mixed",
      existing_gear: [],
    }
    const suitable = {
      id: "1",
      trip_type_suitability: ["weekend", "multi_day"],
      editorial_rating: 5,
    } as ProductWithEditorial
    const notSuitable = {
      id: "2",
      trip_type_suitability: ["overnight"],
      editorial_rating: 5,
    } as ProductWithEditorial
    expect(scoreProduct(suitable, prefs, tripProfile)).toBeGreaterThan(
      scoreProduct(notSuitable, prefs, tripProfile)
    )
  })

  it("handles missing optional fields", () => {
    const prefs: RiderPreferences = {
      weight_vs_durability: 3,
      budget_tier: "mid",
      existing_gear: [],
    }
    const minimal = { id: "1" } as ProductWithEditorial
    const score = scoreProduct(minimal, prefs, tripProfile)
    expect(typeof score).toBe("number")
    expect(score).toBeGreaterThanOrEqual(0)
  })
})
