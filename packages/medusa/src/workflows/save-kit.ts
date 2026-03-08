import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type KitBuilderModuleService from "../modules/kit-builder/service"
import type { BikeProfile, TripProfile, RiderPreferences } from "../modules/kit-builder/lib/types"
import { KIT_BUILDER_MODULE } from "../modules/kit-builder"

export type SaveKitWorkflowInput = {
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
}

const saveKitStep = createStep(
  "save-kit",
  async (input: SaveKitWorkflowInput, { container }) => {
    const kitBuilderService: KitBuilderModuleService = container.resolve(
      KIT_BUILDER_MODULE
    )
    const kit = await kitBuilderService.createSavedKit(input)
    const savedKit = Array.isArray(kit) ? kit[0] : kit
    return new StepResponse(savedKit, { id: savedKit?.id })
  },
  async (compensationData: { id?: string }, { container }) => {
    if (!compensationData?.id) return
    const kitBuilderService: KitBuilderModuleService = container.resolve(
      KIT_BUILDER_MODULE
    )
    await kitBuilderService.deleteSavedKits([compensationData.id])
  }
)

export const saveKitWorkflow = createWorkflow(
  "save-kit",
  (input: SaveKitWorkflowInput) => {
    const kit = saveKitStep(input)
    return new WorkflowResponse(kit)
  }
)
