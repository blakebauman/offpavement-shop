import { model } from "@medusajs/framework/utils"

const SavedKit = model.define("saved_kit", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  session_id: model.text().nullable(),
  bike_profile: model.json(),
  trip_profile: model.json(),
  preferences: model.json(),
  slots: model.json(),
  total_weight_grams: model.number(),
  total_cost: model.number(),
  share_token: model.text().unique(),
})

export default SavedKit
