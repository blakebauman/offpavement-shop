export interface BikeProfile {
  bar_type: "drop" | "flat"
  wheel_size: "26" | "27.5" | "29" | "700c"
  suspension: "rigid" | "hardtail" | "full_sus"
  frame_size: "xs_s" | "m" | "l_xl"
  front_triangle: "small" | "medium" | "large"
  saddle_rail_type: "round" | "carbon_round" | "carbon_flat"
  bar_diameter: "22.2" | "25.4" | "31.8" | "35"
  has_dropper: boolean
}

export interface TripProfile {
  duration: "overnight" | "weekend" | "multi_day" | "expedition"
  terrain: "gravel" | "mixed" | "singletrack" | "touring"
  resupply: "self_sufficient" | "frequent" | "occasional"
}

export interface RiderPreferences {
  weight_vs_durability: 1 | 2 | 3 | 4 | 5
  budget_tier: "budget" | "mid" | "premium" | "mixed"
  existing_gear: string[]
}
