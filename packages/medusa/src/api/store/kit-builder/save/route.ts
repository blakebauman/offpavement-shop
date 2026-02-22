import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { randomUUID } from "node:crypto"
import { KIT_BUILDER_MODULE } from "../../../../modules/kit-builder"
import type KitBuilderModuleService from "../../../../modules/kit-builder/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const kitBuilderService: KitBuilderModuleService = req.scope.resolve(
    KIT_BUILDER_MODULE
  )

  const body = req.body as Record<string, unknown>
  if (!body.bike_profile || !body.trip_profile || !body.preferences || !body.slots || body.total_weight_grams == null || body.total_cost == null) {
    res.status(400).json({
      message: "Missing required fields",
    })
    return
  }

  const customerId = (req as any).auth?.actor_id ?? null
  const sessionId = req.cookies?.kit_session ?? randomUUID()

  try {
    const kit = await kitBuilderService.createSavedKit({
      customer_id: customerId,
      session_id: sessionId,
      bike_profile: body.bike_profile as any,
      trip_profile: body.trip_profile as any,
      preferences: body.preferences as any,
      slots: body.slots as any,
      total_weight_grams: body.total_weight_grams as number,
      total_cost: body.total_cost as number,
    })

    if (typeof kit === "object" && "id" in kit) {
      res.setHeader("Set-Cookie", `kit_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`)
      res.json({ kit })
    } else {
      const [created] = Array.isArray(kit) ? kit : [kit]
      res.setHeader("Set-Cookie", `kit_session=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`)
      res.json({ kit: created })
    }
  } catch (err) {
    console.error("Kit save error:", err)
    res.status(500).json({ message: "Failed to save kit" })
  }
}
