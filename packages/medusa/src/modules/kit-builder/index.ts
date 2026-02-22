import KitBuilderModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const KIT_BUILDER_MODULE = "kitBuilder"

export default Module(KIT_BUILDER_MODULE, {
  service: KitBuilderModuleService,
})
