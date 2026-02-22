import ProductEditorialModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const PRODUCT_EDITORIAL_MODULE = "productEditorial"

export default Module(PRODUCT_EDITORIAL_MODULE, {
  service: ProductEditorialModuleService,
})
