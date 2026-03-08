import {
  recommendationsSchema,
  saveKitSchema,
} from "../schemas"

const validBikeProfile = {
  bar_type: "drop",
  wheel_size: "29",
  suspension: "hardtail",
  frame_size: "m",
  front_triangle: "medium",
  saddle_rail_type: "round",
  bar_diameter: "31.8",
  has_dropper: false,
}

const validTripProfile = {
  duration: "weekend",
  terrain: "gravel",
  resupply: "self_sufficient",
}

const validPreferences = {
  weight_vs_durability: 3,
  budget_tier: "mid" as const,
  existing_gear: [],
}

describe("recommendationsSchema", () => {
  it("accepts valid input", () => {
    const result = recommendationsSchema.safeParse({
      bikeProfile: validBikeProfile,
      tripProfile: validTripProfile,
      preferences: validPreferences,
    })
    expect(result.success).toBe(true)
  })

  it("rejects missing bikeProfile", () => {
    const result = recommendationsSchema.safeParse({
      tripProfile: validTripProfile,
      preferences: validPreferences,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid bar_type", () => {
    const result = recommendationsSchema.safeParse({
      bikeProfile: { ...validBikeProfile, bar_type: "invalid" },
      tripProfile: validTripProfile,
      preferences: validPreferences,
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid weight_vs_durability (must be 1-5)", () => {
    const result = recommendationsSchema.safeParse({
      bikeProfile: validBikeProfile,
      tripProfile: validTripProfile,
      preferences: { ...validPreferences, weight_vs_durability: 6 },
    })
    expect(result.success).toBe(false)
  })

  it("defaults existing_gear to empty array when omitted", () => {
    const result = recommendationsSchema.safeParse({
      bikeProfile: validBikeProfile,
      tripProfile: validTripProfile,
      preferences: { weight_vs_durability: 3, budget_tier: "mid" },
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.preferences.existing_gear).toEqual([])
    }
  })
})

describe("saveKitSchema", () => {
  it("accepts valid input with empty slots", () => {
    const result = saveKitSchema.safeParse({
      bike_profile: validBikeProfile,
      trip_profile: validTripProfile,
      preferences: validPreferences,
      slots: {},
      total_weight_grams: 0,
      total_cost: 0,
    })
    expect(result.success).toBe(true)
  })

  it("accepts valid input with slots", () => {
    const result = saveKitSchema.safeParse({
      bike_profile: validBikeProfile,
      trip_profile: validTripProfile,
      preferences: validPreferences,
      slots: {
        frame_bag: {
          recommended_product_id: "prod_1",
          selected_product_id: "prod_1",
          swapped: false,
          owned: false,
        },
      },
      total_weight_grams: 1500,
      total_cost: 5000,
    })
    expect(result.success).toBe(true)
  })

  it("rejects negative total_weight_grams", () => {
    const result = saveKitSchema.safeParse({
      bike_profile: validBikeProfile,
      trip_profile: validTripProfile,
      preferences: validPreferences,
      slots: {},
      total_weight_grams: -1,
      total_cost: 0,
    })
    expect(result.success).toBe(false)
  })

  it("rejects empty selected_product_id in slot", () => {
    const result = saveKitSchema.safeParse({
      bike_profile: validBikeProfile,
      trip_profile: validTripProfile,
      preferences: validPreferences,
      slots: {
        frame_bag: {
          recommended_product_id: "prod_1",
          selected_product_id: "",
          swapped: false,
          owned: false,
        },
      },
      total_weight_grams: 0,
      total_cost: 0,
    })
    expect(result.success).toBe(false)
  })
})
