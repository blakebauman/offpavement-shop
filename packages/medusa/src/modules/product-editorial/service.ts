import { MedusaService } from "@medusajs/framework/utils"
import ProductEditorial from "./models/product-editorial"

class ProductEditorialModuleService extends MedusaService({
  ProductEditorial,
}) {}

export default ProductEditorialModuleService
