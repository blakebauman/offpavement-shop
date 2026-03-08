import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { KIT_BUILDER_MODULE } from "../../../../modules/kit-builder"
import type KitBuilderModuleService from "../../../../modules/kit-builder/service"
import type { ProductWithEditorial } from "../../../../modules/kit-builder/lib/scoring"
import { recommendationsSchema } from "../schemas"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = recommendationsSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: "Validation failed",
      errors: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const { bikeProfile, tripProfile, preferences } = parsed.data

  const kitBuilderService: KitBuilderModuleService = req.scope.resolve(
    KIT_BUILDER_MODULE
  )
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "weight",
      "metadata",
      "productEditorial.*",
    ],
    filters: { status: "published" },
    pagination: { take: 500 },
  })

  const productsWithEditorial: ProductWithEditorial[] = (products ?? []).map(
    (p: Record<string, unknown>) => {
      const meta = (p.metadata ?? {}) as Record<string, unknown>
      const editorial = p.productEditorial as Record<string, unknown> | null
      const w =
        meta.weight_grams ??
        (editorial?.weight_grams as number) ??
        (p.weight as number) ??
        0
      const dr = meta.durability_rating ?? (editorial?.durability_rating as number)
      const er = meta.editorial_rating ?? (editorial?.editorial_rating as number) ?? 5
      const priceTier =
        meta.price_tier ?? (editorial?.price_tier as string)
      const tripSuit =
        meta.trip_type_suitability ??
        (editorial?.trip_type_suitability as string[]) ??
        []

      return {
        id: p.id as string,
        title: p.title as string,
        weight_grams: typeof w === "number" ? w : 0,
        durability_rating: typeof dr === "number" ? dr : null,
        price_tier: priceTier as ProductWithEditorial["price_tier"],
        trip_type_suitability: Array.isArray(tripSuit) ? tripSuit : [],
        editorial_rating: typeof er === "number" ? er : 5,
        compatibility_rules: (meta.compatibility_rules ??
          editorial?.compatibility_rules) as unknown[] | null,
        kit_slots: (meta.kit_slots ?? []) as string[],
      }
    }
  )

  const recommendations = kitBuilderService.generateRecommendations(
    productsWithEditorial,
    bikeProfile,
    tripProfile,
    preferences
  )

  res.json({ recommendations })
}
