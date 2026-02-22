import { model } from "@medusajs/framework/utils"

const ProductEditorial = model.define("product_editorial", {
  id: model.id().primaryKey(),
  tester_name: model.text(),
  test_duration_days: model.number(),
  test_conditions: model.json(),
  editorial_brief: model.text(),
  verdict: model.text(),
  not_good_for: model.json(),
  bike_type_compatibility: model.json(),
  trip_type_suitability: model.json(),
  mounting_type: model.json(),
  weight_grams: model.number().nullable(),
  volume_liters: model.number().nullable(),
  price_tier: model.enum(["budget", "mid", "premium"]),
  editorial_rating: model.number(),
  durability_rating: model.number().nullable(),
  compatibility_rules: model.json().nullable(),
})

export default ProductEditorial
