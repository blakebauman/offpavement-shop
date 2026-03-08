import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
} from "@medusajs/medusa/core-flows";
import * as fs from "fs";
import * as path from "path";

// Load Wolf Tooth product data from JSON
const dataPath = path.join(__dirname, "../data/wolf-tooth-products.json");
const wolfToothData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

interface ProductVariant {
  title: string;
  sku: string;
  options: Record<string, string>;
  prices: Array<{ amount: number; currency_code: string }>;
}

interface ProductOption {
  title: string;
  values: string[];
}

interface ProductData {
  title: string;
  handle: string;
  description: string;
  category_handles: string[];
  weight: number;
  images: Array<{ url: string }>;
  options: ProductOption[];
  variants: ProductVariant[];
  metadata: Record<string, unknown>;
}

interface CategoryData {
  name: string;
  handle: string;
  subcategories?: Array<{ name: string; handle: string }>;
}

export default async function importWolfToothProducts({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);

  logger.info("Starting Wolf Tooth Components import...");

  // Get existing sales channel
  const salesChannels = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!salesChannels.length) {
    throw new Error(
      "Default Sales Channel not found. Please run seed script first."
    );
  }

  const defaultSalesChannel = salesChannels[0];
  logger.info(`Using sales channel: ${defaultSalesChannel.name}`);

  // Get existing shipping profile
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });

  if (!shippingProfiles.length) {
    throw new Error(
      "Default shipping profile not found. Please run seed script first."
    );
  }

  const shippingProfile = shippingProfiles[0];
  logger.info(`Using shipping profile: ${shippingProfile.name}`);

  // Get stock location
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  });

  if (!stockLocations.length) {
    throw new Error("No stock location found. Please run seed script first.");
  }

  const stockLocation = stockLocations[0];
  logger.info(`Using stock location: ${stockLocation.name}`);

  // Create Wolf Tooth categories
  logger.info("Creating Wolf Tooth product categories...");

  const categoryInputs: Array<{
    name: string;
    handle: string;
    is_active: boolean;
    parent_category_id?: string;
  }> = [];

  // First pass: create parent categories
  for (const category of wolfToothData.categories as CategoryData[]) {
    categoryInputs.push({
      name: category.name,
      handle: category.handle,
      is_active: true,
    });
  }

  const { result: parentCategoryResult } =
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: categoryInputs,
      },
    });

  logger.info(`Created ${parentCategoryResult.length} parent categories`);

  // Create a map of handle -> category for lookup
  const categoryMap = new Map<string, { id: string; name: string }>();
  for (const category of parentCategoryResult) {
    categoryMap.set(category.handle, { id: category.id, name: category.name });
  }

  // Second pass: create subcategories
  const subcategoryInputs: Array<{
    name: string;
    handle: string;
    is_active: boolean;
    parent_category_id: string;
  }> = [];

  for (const category of wolfToothData.categories as CategoryData[]) {
    if (category.subcategories) {
      const parentCategory = categoryMap.get(category.handle);
      if (parentCategory) {
        for (const subcategory of category.subcategories) {
          subcategoryInputs.push({
            name: subcategory.name,
            handle: subcategory.handle,
            is_active: true,
            parent_category_id: parentCategory.id,
          });
        }
      }
    }
  }

  if (subcategoryInputs.length > 0) {
    const { result: subcategoryResult } =
      await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: subcategoryInputs,
        },
      });

    logger.info(`Created ${subcategoryResult.length} subcategories`);

    // Add subcategories to the map
    for (const category of subcategoryResult) {
      categoryMap.set(category.handle, {
        id: category.id,
        name: category.name,
      });
    }
  }

  // Create products
  logger.info("Creating Wolf Tooth products...");

  const productInputs = (wolfToothData.products as ProductData[]).map(
    (product) => {
      // Get category IDs from handles
      const categoryIds = product.category_handles
        .map((handle: string) => categoryMap.get(handle)?.id)
        .filter((id): id is string => id !== undefined);

      return {
        title: product.title,
        handle: product.handle,
        description: product.description,
        category_ids: categoryIds,
        weight: product.weight,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: shippingProfile.id,
        images: product.images,
        options: product.options,
        variants: product.variants,
        metadata: product.metadata,
        sales_channels: [{ id: defaultSalesChannel.id }],
      };
    }
  );

  const { result: productResult } = await createProductsWorkflow(container).run(
    {
      input: {
        products: productInputs,
      },
    }
  );

  logger.info(`Created ${productResult.length} products`);

  // Count total variants
  const totalVariants = productResult.reduce(
    (sum, product) => sum + (product.variants?.length || 0),
    0
  );
  logger.info(`Total variants created: ${totalVariants}`);

  // Set inventory levels for all new products
  logger.info("Setting inventory levels...");

  // Get inventory items for the new products
  const productIds = productResult.map((p) => p.id);

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
    filters: {},
  });

  // Filter to only items that don't have inventory levels at our location yet
  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    fields: ["inventory_item_id"],
    filters: {
      location_id: stockLocation.id,
    },
  });

  const existingItemIds = new Set(
    existingLevels.map((l) => l.inventory_item_id)
  );

  const newInventoryItems = inventoryItems.filter(
    (item) => !existingItemIds.has(item.id)
  );

  if (newInventoryItems.length > 0) {
    const inventoryLevels: CreateInventoryLevelInput[] = newInventoryItems.map(
      (item) => ({
        location_id: stockLocation.id,
        stocked_quantity: 100,
        inventory_item_id: item.id,
      })
    );

    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryLevels,
      },
    });

    logger.info(`Created inventory levels for ${inventoryLevels.length} items`);
  }

  logger.info("Wolf Tooth Components import complete!");
  logger.info(`Summary:`);
  logger.info(`  - Categories: ${categoryMap.size}`);
  logger.info(`  - Products: ${productResult.length}`);
  logger.info(`  - Variants: ${totalVariants}`);
}
