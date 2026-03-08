import { z } from "zod"

const bikeProfileSchema = z.object({
  bar_type: z.enum(["drop", "flat"]),
  wheel_size: z.enum(["26", "27.5", "29", "700c"]),
  suspension: z.enum(["rigid", "hardtail", "full_sus"]),
  frame_size: z.enum(["xs_s", "m", "l_xl"]),
  front_triangle: z.enum(["small", "medium", "large"]),
  saddle_rail_type: z.enum(["round", "carbon_round", "carbon_flat"]),
  bar_diameter: z.enum(["22.2", "25.4", "31.8", "35"]),
  has_dropper: z.boolean(),
})

const tripProfileSchema = z.object({
  duration: z.enum(["overnight", "weekend", "multi_day", "expedition"]),
  terrain: z.enum(["gravel", "mixed", "singletrack", "touring"]),
  resupply: z.enum(["self_sufficient", "frequent", "occasional"]),
})

const riderPreferencesSchema = z.object({
  weight_vs_durability: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  budget_tier: z.enum(["budget", "mid", "premium", "mixed"]),
  existing_gear: z.array(z.string()).default([]),
})

export const recommendationsSchema = z.object({
  bikeProfile: bikeProfileSchema,
  tripProfile: tripProfileSchema,
  preferences: riderPreferencesSchema,
})

const slotEntrySchema = z.object({
  recommended_product_id: z.string().min(1),
  selected_product_id: z.string().min(1),
  swapped: z.boolean(),
  owned: z.boolean(),
})

export const saveKitSchema = z.object({
  bike_profile: bikeProfileSchema,
  trip_profile: tripProfileSchema,
  preferences: riderPreferencesSchema,
  slots: z.record(z.string(), slotEntrySchema),
  total_weight_grams: z.number().min(0),
  total_cost: z.number().min(0),
})

export type RecommendationsInput = z.infer<typeof recommendationsSchema>
export type SaveKitInput = z.infer<typeof saveKitSchema>
