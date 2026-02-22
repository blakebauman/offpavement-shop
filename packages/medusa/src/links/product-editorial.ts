import ProductModule from "@medusajs/medusa/product"
import ProductEditorialModule from "../modules/product-editorial"
import { defineLink } from "@medusajs/framework/utils"

export default defineLink(
  ProductModule.linkable.product,
  ProductEditorialModule.linkable.productEditorial
)
