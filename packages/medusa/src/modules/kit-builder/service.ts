import { MedusaService } from "@medusajs/framework/utils"
import { randomUUID } from "node:crypto"
import SavedKit from "./models/saved_kit"
import { evaluateCompatibility } from "./lib/compatibility-engine"
import { scoreProduct } from "./lib/scoring"
import { KIT_SLOTS } from "./lib/kit-slots"
import type { BikeProfile, TripProfile, RiderPreferences, CompatibilityRule } from "./lib/types"
import type { ProductWithEditorial } from "./lib/scoring"

function getSlotProducts(
  products: ProductWithEditorial[],
  slotName: string
): ProductWithEditorial[] {
  return products.filter((p) => {
    const slots = p.kit_slots ?? []
    if (slots.length === 0) return true
    return slots.includes(slotName)
  })
}

class KitBuilderModuleService extends MedusaService({
  SavedKit,
}) {
  generateRecommendations(
    products: ProductWithEditorial[],
    bikeProfile: BikeProfile,
    tripProfile: TripProfile,
    preferences: RiderPreferences
  ): Record<
    string,
    { recommended: ProductWithEditorial; alternatives: ProductWithEditorial[] }
  > {
    const duration = tripProfile.duration
    const result: Record<
      string,
      { recommended: ProductWithEditorial; alternatives: ProductWithEditorial[] }
    > = {}

    for (const [slotName, slotConfig] of Object.entries(KIT_SLOTS)) {
      const isRequired =
        slotConfig.required.includes("all") ||
        slotConfig.required.includes(duration)
      const isOptional =
        slotConfig.optional.includes("all") ||
        slotConfig.optional.includes(duration)
      if (!isRequired && !isOptional) continue

      const slotProducts = getSlotProducts(products, slotName)

      if (slotProducts.length === 0 && !isRequired) continue

      const compatible = slotProducts.filter((p) => {
        const res = evaluateCompatibility(
          p as { compatibility_rules?: CompatibilityRule[] | null },
          bikeProfile
        )
        return res.status !== "incompatible"
      })

      const scored = compatible
        .map((p) => ({
          product: p,
          score: scoreProduct(p, preferences, tripProfile),
        }))
        .sort((a, b) => b.score - a.score)

      const [recommended, ...alternatives] = scored.map((s) => s.product)
      if (recommended) {
        result[slotName] = {
          recommended,
          alternatives: alternatives.slice(0, 3),
        }
      }
    }

    return result
  }

  async createSavedKit(data: {
    customer_id?: string | null
    session_id?: string | null
    bike_profile: BikeProfile
    trip_profile: TripProfile
    preferences: RiderPreferences
    slots: Record<
      string,
      {
        recommended_product_id: string
        selected_product_id: string
        swapped: boolean
        owned: boolean
      }
    >
    total_weight_grams: number
    total_cost: number
  }) {
    const share_token = randomUUID().replace(/-/g, "").slice(0, 12)
    return this.createSavedKits({
      ...data,
      share_token,
    } as any)
  }

  async getKitByShareToken(token: string) {
    const [kit] = await this.listSavedKits({ share_token: token })
    return kit ?? null
  }

  async listKitsByCustomer(customerId: string) {
    return this.listSavedKits({ customer_id: customerId })
  }

  async listKitsBySession(sessionId: string) {
    return this.listSavedKits({ session_id: sessionId })
  }
}

export default KitBuilderModuleService
