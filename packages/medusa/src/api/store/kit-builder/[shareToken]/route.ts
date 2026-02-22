import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { KIT_BUILDER_MODULE } from "../../../../modules/kit-builder"
import type KitBuilderModuleService from "../../../../modules/kit-builder/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const kitBuilderService: KitBuilderModuleService = req.scope.resolve(
    KIT_BUILDER_MODULE
  )
  const { shareToken } = req.params

  if (!shareToken) {
    res.status(400).json({ message: "Missing share token" })
    return
  }

  const kit = await kitBuilderService.getKitByShareToken(shareToken)
  if (!kit) {
    res.status(404).json({ message: "Kit not found" })
    return
  }

  res.json({ kit })
}
