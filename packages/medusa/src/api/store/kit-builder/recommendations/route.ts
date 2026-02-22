import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { KIT_BUILDER_MODULE } from "../../../../modules/kit-builder"
import type KitBuilderModuleService from "../../../../modules/kit-builder/service"
import type { ProductWithEditorial } from "../../../../modules/kit-builder/lib/scoring"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const kitBuilderService: KitBuilderModuleService = req.scope.resolve(
    KIT_BUILDER_MODULE
  )
  const productService = req.scope.resolve(Modules.PRODUCT)

  const { bikeProfile, tripProfile, preferences } = req.body as {
    bikeProfile: unknown
    tripProfile: unknown
    preferences: unknown
  }

  if (!bikeProfile || !tripProfile || !preferences) {
    res.status(400).json({
      message: "Missing bikeProfile, tripProfile, or preferences",
    })
    return
  }

  const products = await productService.listProducts(
    { status: "published" },
    { take: 500 }
  )

  const productsWithEditorial: ProductWithEditorial[] = (products ?? []).map((p) => {
    const meta = (p.metadata ?? {}) as Record<string, unknown>
    const w = meta.weight_grams ?? p.weight ?? 0
    const dr = meta.durability_rating
    const er = meta.editorial_rating ?? 5
    return {
      id: p.id,
      title: p.title,
      weight_grams: typeof w === "number" ? w : 0,
      durability_rating: typeof dr === "number" ? dr : null,
      price_tier: (meta.price_tier as ProductWithEditorial["price_tier"]) ?? undefined,
      trip_type_suitability: (meta.trip_type_suitability as string[]) ?? [],
      editorial_rating: typeof er === "number" ? er : 5,
      compatibility_rules: meta.compatibility_rules as unknown[] | null,
      kit_slots: (meta.kit_slots ?? []) as string[],
    }
  })

  const recommendations = kitBuilderService.generateRecommendations(
    productsWithEditorial,
    bikeProfile as Parameters<typeof kitBuilderService.generateRecommendations>[1],
    tripProfile as Parameters<typeof kitBuilderService.generateRecommendations>[2],
    preferences as Parameters<typeof kitBuilderService.generateRecommendations>[3]
  )

  res.json({ recommendations })
}
