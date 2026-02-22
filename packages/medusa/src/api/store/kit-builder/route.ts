import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { KIT_BUILDER_MODULE } from "../../../modules/kit-builder"
import type KitBuilderModuleService from "../../../modules/kit-builder/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const kitBuilderService: KitBuilderModuleService = req.scope.resolve(
    KIT_BUILDER_MODULE
  )

  const customerId = (req as any).auth?.actor_id ?? null
  const sessionId = req.cookies?.kit_session

  if (!customerId && !sessionId) {
    res.json({ kits: [] })
    return
  }

  let kits
  if (customerId) {
    kits = await kitBuilderService.listKitsByCustomer(customerId)
  } else {
    kits = await kitBuilderService.listKitsBySession(sessionId)
  }

  res.json({ kits })
}
