import { CreateInventoryLevelInput, ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ApiKey } from "../../.medusa/types/query-entry-points";

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["us"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "usd",
          is_default: true,
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const { result: regionResult } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: "United States",
          currency_code: "usd",
          countries,
          payment_providers: ["pp_stripe_stripe"],
        },
      ],
    },
  });
  const region = regionResult[0];
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code,
      provider_id: "tp_system",
    })),
  });
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding stock location data...");
  const { result: stockLocationResult } = await createStockLocationsWorkflow(
    container
  ).run({
    input: {
      locations: [
        {
          name: "US Warehouse",
          address: {
            city: "Portland",
            country_code: "US",
            address_1: "",
          },
        },
      ],
    },
  });
  const stockLocation = stockLocationResult[0];

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: stockLocation.id,
      },
    },
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_provider_id: "manual_manual",
    },
  });

  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
    name: "US Warehouse delivery",
    type: "shipping",
    service_zones: [
      {
        name: "United States",
        geo_zones: [
          {
            country_code: "us",
            type: "country",
          },
        ],
      },
    ],
  });

  await link.create({
    [Modules.STOCK_LOCATION]: {
      stock_location_id: stockLocation.id,
    },
    [Modules.FULFILLMENT]: {
      fulfillment_set_id: fulfillmentSet.id,
    },
  });

  await createShippingOptionsWorkflow(container).run({
    input: [
      {
        name: "Standard Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Standard",
          description: "Ship in 2-3 days.",
          code: "standard",
        },
        prices: [
          {
            region_id: region.id,
            amount: 1000,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
      {
        name: "Express Shipping",
        price_type: "flat",
        provider_id: "manual_manual",
        service_zone_id: fulfillmentSet.service_zones[0].id,
        shipping_profile_id: shippingProfile.id,
        type: {
          label: "Express",
          description: "Ship in 24 hours.",
          code: "express",
        },
        prices: [
          {
            region_id: region.id,
            amount: 2500,
          },
        ],
        rules: [
          {
            attribute: "enabled_in_store",
            value: "true",
            operator: "eq",
          },
          {
            attribute: "is_return",
            value: "false",
            operator: "eq",
          },
        ],
      },
    ],
  });
  logger.info("Finished seeding fulfillment data.");

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: stockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding stock location data.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey: ApiKey | null = null;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: {
      type: "publishable",
    },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Webshop",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });

    publishableApiKey = publishableApiKeyResult as ApiKey;
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id],
    },
  });
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product data...");

  const { result: categoryResult } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: [
        { name: "Shirts", is_active: true },
        { name: "Sweatshirts", is_active: true },
        { name: "Pants", is_active: true },
        { name: "Merch", is_active: true },
        { name: "Frame Bags", is_active: true },
        { name: "Seat Bags", is_active: true },
        { name: "Handlebar Bags", is_active: true },
        { name: "Top Tube Bags", is_active: true },
        { name: "Feed Bags", is_active: true },
        { name: "Shelters", is_active: true },
        { name: "Sleeping Bags", is_active: true },
        { name: "Sleeping Pads", is_active: true },
        { name: "Stoves", is_active: true },
        { name: "Cook Pots", is_active: true },
        { name: "GPS Devices", is_active: true },
        { name: "Tool Kits", is_active: true },
        { name: "First Aid", is_active: true },
      ],
    },
  });

  await createProductsWorkflow(container).run({
    input: {
      products: [
        {
          title: "Medusa T-Shirt",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Shirts")!.id,
          ],
          description:
            "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.",
          handle: "t-shirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL"],
            },
            {
              title: "Color",
              values: ["Black", "White"],
            },
          ],
          variants: [
            {
              title: "S / Black",
              sku: "SHIRT-S-BLACK",
              options: {
                Size: "S",
                Color: "Black",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "S / White",
              sku: "SHIRT-S-WHITE",
              options: {
                Size: "S",
                Color: "White",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "M / Black",
              sku: "SHIRT-M-BLACK",
              options: {
                Size: "M",
                Color: "Black",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "M / White",
              sku: "SHIRT-M-WHITE",
              options: {
                Size: "M",
                Color: "White",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "L / Black",
              sku: "SHIRT-L-BLACK",
              options: {
                Size: "L",
                Color: "Black",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "L / White",
              sku: "SHIRT-L-WHITE",
              options: {
                Size: "L",
                Color: "White",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "XL / Black",
              sku: "SHIRT-XL-BLACK",
              options: {
                Size: "XL",
                Color: "Black",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "XL / White",
              sku: "SHIRT-XL-WHITE",
              options: {
                Size: "XL",
                Color: "White",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Sweatshirt",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sweatshirts")!.id,
          ],
          description:
            "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
          handle: "sweatshirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "SWEATSHIRT-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "M",
              sku: "SWEATSHIRT-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "L",
              sku: "SWEATSHIRT-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "XL",
              sku: "SWEATSHIRT-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Sweatpants",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Pants")!.id,
          ],
          description:
            "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.",
          handle: "sweatpants",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "SWEATPANTS-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "M",
              sku: "SWEATPANTS-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "L",
              sku: "SWEATPANTS-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "XL",
              sku: "SWEATPANTS-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        {
          title: "Medusa Shorts",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Merch")!.id,
          ],
          description:
            "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.",
          handle: "shorts",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          images: [
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png",
            },
            {
              url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png",
            },
          ],
          options: [
            {
              title: "Size",
              values: ["S", "M", "L", "XL"],
            },
          ],
          variants: [
            {
              title: "S",
              sku: "SHORTS-S",
              options: {
                Size: "S",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "M",
              sku: "SHORTS-M",
              options: {
                Size: "M",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "L",
              sku: "SHORTS-L",
              options: {
                Size: "L",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
            {
              title: "XL",
              sku: "SHORTS-XL",
              options: {
                Size: "XL",
              },
              prices: [
                {
                  amount: 1500,
                  currency_code: "usd",
                },
              ],
            },
          ],
          sales_channels: [
            {
              id: defaultSalesChannel[0].id,
            },
          ],
        },
        // === FRAME BAGS ===
        {
          title: "Revelate Designs Tangle Frame Bag",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Frame Bags")!.id,
          ],
          description: "Full-frame bag with waterproof construction. Multiple sizes available for different frame geometries.",
          handle: "revelate-tangle-frame-bag",
          weight: 280,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["frame_bag"],
            weight_grams: 280,
            price_tier: "premium",
            durability_rating: 9,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" },
          ],
          options: [{ title: "Size", values: ["Small", "Medium", "Large"] }],
          variants: [
            {
              title: "Small",
              sku: "REV-TANGLE-SM",
              options: { Size: "Small" },
              prices: [{ amount: 13500, currency_code: "usd" }],
            },
            {
              title: "Medium",
              sku: "REV-TANGLE-MD",
              options: { Size: "Medium" },
              prices: [{ amount: 15000, currency_code: "usd" }],
            },
            {
              title: "Large",
              sku: "REV-TANGLE-LG",
              options: { Size: "Large" },
              prices: [{ amount: 16500, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Apidura Expedition Frame Pack",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Frame Bags")!.id,
          ],
          description: "Lightweight, fully waterproof frame bag designed for ultra-endurance events.",
          handle: "apidura-expedition-frame",
          weight: 195,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["frame_bag"],
            weight_grams: 195,
            price_tier: "premium",
            durability_rating: 8,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" },
          ],
          options: [{ title: "Size", values: ["4.5L", "6L"] }],
          variants: [
            {
              title: "4.5L",
              sku: "API-EXP-FRAME-4",
              options: { Size: "4.5L" },
              prices: [{ amount: 14900, currency_code: "usd" }],
            },
            {
              title: "6L",
              sku: "API-EXP-FRAME-6",
              options: { Size: "6L" },
              prices: [{ amount: 16900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Rockgeist Half Frame Bag",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Frame Bags")!.id,
          ],
          description: "Budget-friendly half frame bag. Good for bottles + gear access.",
          handle: "rockgeist-half-frame",
          weight: 150,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["frame_bag"],
            weight_grams: 150,
            price_tier: "budget",
            durability_rating: 6,
            editorial_rating: 7,
            trip_type_suitability: ["overnight", "weekend"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" },
          ],
          options: [{ title: "Color", values: ["Black"] }],
          variants: [
            {
              title: "Black",
              sku: "RG-HALF-BLK",
              options: { Color: "Black" },
              prices: [{ amount: 4500, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === SEAT BAGS ===
        {
          title: "Revelate Designs Terrapin System",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Seat Bags")!.id,
          ],
          description: "Modular seat bag system with waterproof dry bag. Industry standard for bikepacking.",
          handle: "revelate-terrapin",
          weight: 340,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["seat_bag"],
            weight_grams: 340,
            price_tier: "premium",
            durability_rating: 9,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
            compatibility_rules: [
              { type: "excludes", attribute: "has_dropper", operator: "eq", value: true, message: "Not compatible with dropper posts" },
            ],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png" },
          ],
          options: [{ title: "Size", values: ["8L", "14L"] }],
          variants: [
            {
              title: "8L",
              sku: "REV-TERRA-8",
              options: { Size: "8L" },
              prices: [{ amount: 12900, currency_code: "usd" }],
            },
            {
              title: "14L",
              sku: "REV-TERRA-14",
              options: { Size: "14L" },
              prices: [{ amount: 14900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Apidura Backcountry Saddle Pack",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Seat Bags")!.id,
          ],
          description: "Dropper-compatible seat bag with innovative attachment system.",
          handle: "apidura-backcountry-saddle",
          weight: 290,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["seat_bag"],
            weight_grams: 290,
            price_tier: "premium",
            durability_rating: 8,
            editorial_rating: 8,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png" },
          ],
          options: [{ title: "Size", values: ["6L", "11L", "17L"] }],
          variants: [
            {
              title: "6L",
              sku: "API-BC-SAD-6",
              options: { Size: "6L" },
              prices: [{ amount: 11900, currency_code: "usd" }],
            },
            {
              title: "11L",
              sku: "API-BC-SAD-11",
              options: { Size: "11L" },
              prices: [{ amount: 13900, currency_code: "usd" }],
            },
            {
              title: "17L",
              sku: "API-BC-SAD-17",
              options: { Size: "17L" },
              prices: [{ amount: 15900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Ortlieb Seat-Pack",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Seat Bags")!.id,
          ],
          description: "German-engineered waterproof seat bag with roll-top closure.",
          handle: "ortlieb-seat-pack",
          weight: 380,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["seat_bag"],
            weight_grams: 380,
            price_tier: "mid",
            durability_rating: 9,
            editorial_rating: 8,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
            compatibility_rules: [
              { type: "excludes", attribute: "has_dropper", operator: "eq", value: true, message: "Not compatible with dropper posts" },
            ],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png" },
          ],
          options: [{ title: "Size", values: ["11L", "16.5L"] }],
          variants: [
            {
              title: "11L",
              sku: "ORT-SEAT-11",
              options: { Size: "11L" },
              prices: [{ amount: 9900, currency_code: "usd" }],
            },
            {
              title: "16.5L",
              sku: "ORT-SEAT-16",
              options: { Size: "16.5L" },
              prices: [{ amount: 10900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === HANDLEBAR BAGS ===
        {
          title: "Revelate Designs Sweetroll",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Handlebar Bags")!.id,
          ],
          description: "Classic handlebar roll with compression straps. Perfect for sleeping bags and clothing.",
          handle: "revelate-sweetroll",
          weight: 220,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["handlebar_bag"],
            weight_grams: 220,
            price_tier: "premium",
            durability_rating: 9,
            editorial_rating: 9,
            trip_type_suitability: ["weekend", "multi_day", "expedition"],
            compatibility_rules: [
              { type: "excludes", attribute: "bar_type", operator: "eq", value: "aero", message: "Not compatible with aero bars" },
            ],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" },
          ],
          options: [{ title: "Size", values: ["Small", "Medium", "Large"] }],
          variants: [
            {
              title: "Small",
              sku: "REV-SWEET-SM",
              options: { Size: "Small" },
              prices: [{ amount: 11900, currency_code: "usd" }],
            },
            {
              title: "Medium",
              sku: "REV-SWEET-MD",
              options: { Size: "Medium" },
              prices: [{ amount: 12900, currency_code: "usd" }],
            },
            {
              title: "Large",
              sku: "REV-SWEET-LG",
              options: { Size: "Large" },
              prices: [{ amount: 13900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Apidura Handlebar Pack",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Handlebar Bags")!.id,
          ],
          description: "Aerodynamic handlebar bag with internal organization pockets.",
          handle: "apidura-handlebar-pack",
          weight: 185,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["handlebar_bag"],
            weight_grams: 185,
            price_tier: "premium",
            durability_rating: 8,
            editorial_rating: 8,
            trip_type_suitability: ["weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" },
          ],
          options: [{ title: "Size", values: ["9L", "14L", "20L"] }],
          variants: [
            {
              title: "9L",
              sku: "API-HB-9",
              options: { Size: "9L" },
              prices: [{ amount: 10900, currency_code: "usd" }],
            },
            {
              title: "14L",
              sku: "API-HB-14",
              options: { Size: "14L" },
              prices: [{ amount: 12900, currency_code: "usd" }],
            },
            {
              title: "20L",
              sku: "API-HB-20",
              options: { Size: "20L" },
              prices: [{ amount: 14900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === TOP TUBE BAGS ===
        {
          title: "Revelate Designs Mag-Tank",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Top Tube Bags")!.id,
          ],
          description: "Magnetic closure top tube bag for quick snack access.",
          handle: "revelate-mag-tank",
          weight: 85,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["top_tube_bag"],
            weight_grams: 85,
            price_tier: "mid",
            durability_rating: 8,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png" },
          ],
          options: [{ title: "Size", values: ["Standard", "Bolt-On"] }],
          variants: [
            {
              title: "Standard",
              sku: "REV-MAGTANK-STD",
              options: { Size: "Standard" },
              prices: [{ amount: 5900, currency_code: "usd" }],
            },
            {
              title: "Bolt-On",
              sku: "REV-MAGTANK-BOLT",
              options: { Size: "Bolt-On" },
              prices: [{ amount: 6900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Apidura Racing Top Tube Pack",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Top Tube Bags")!.id,
          ],
          description: "Ultra-light top tube bag designed for racing. Minimal bulk.",
          handle: "apidura-racing-toptube",
          weight: 55,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["top_tube_bag"],
            weight_grams: 55,
            price_tier: "premium",
            durability_rating: 7,
            editorial_rating: 8,
            trip_type_suitability: ["overnight", "weekend", "multi_day"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png" },
          ],
          options: [{ title: "Size", values: ["0.5L", "1L"] }],
          variants: [
            {
              title: "0.5L",
              sku: "API-RAC-TT-05",
              options: { Size: "0.5L" },
              prices: [{ amount: 4900, currency_code: "usd" }],
            },
            {
              title: "1L",
              sku: "API-RAC-TT-1",
              options: { Size: "1L" },
              prices: [{ amount: 5400, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === FEED BAGS ===
        {
          title: "Revelate Designs Mountain Feedbag",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Feed Bags")!.id,
          ],
          description: "Stem-mounted snack bag for hands-free eating. Easy access while riding.",
          handle: "revelate-mountain-feedbag",
          weight: 65,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["feed_bag"],
            weight_grams: 65,
            price_tier: "mid",
            durability_rating: 8,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png" },
          ],
          options: [{ title: "Color", values: ["Black", "Camo"] }],
          variants: [
            {
              title: "Black",
              sku: "REV-FEED-BLK",
              options: { Color: "Black" },
              prices: [{ amount: 3500, currency_code: "usd" }],
            },
            {
              title: "Camo",
              sku: "REV-FEED-CAMO",
              options: { Color: "Camo" },
              prices: [{ amount: 3500, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === SHELTERS ===
        {
          title: "Big Agnes Copper Spur HV UL1",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Shelters")!.id,
          ],
          description: "Ultralight freestanding tent with full protection. The go-to for weight-conscious bikepackers.",
          handle: "big-agnes-copper-spur-ul1",
          weight: 850,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["shelter"],
            weight_grams: 850,
            price_tier: "premium",
            durability_rating: 7,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png" },
          ],
          options: [{ title: "Color", values: ["Olive"] }],
          variants: [
            {
              title: "Olive",
              sku: "BA-COPPER-UL1",
              options: { Color: "Olive" },
              prices: [{ amount: 39900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Tarptent ProTrail Li",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Shelters")!.id,
          ],
          description: "Single-wall trekking pole shelter. Lightest option for gram counters.",
          handle: "tarptent-protrail-li",
          weight: 450,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["shelter"],
            weight_grams: 450,
            price_tier: "premium",
            durability_rating: 6,
            editorial_rating: 8,
            trip_type_suitability: ["overnight", "weekend", "multi_day"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png" },
          ],
          options: [{ title: "Color", values: ["Yellow"] }],
          variants: [
            {
              title: "Yellow",
              sku: "TT-PROTRAIL-LI",
              options: { Color: "Yellow" },
              prices: [{ amount: 34900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Naturehike Cloud-Up 1",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Shelters")!.id,
          ],
          description: "Budget-friendly ultralight tent. Great value for occasional use.",
          handle: "naturehike-cloud-up-1",
          weight: 1150,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["shelter"],
            weight_grams: 1150,
            price_tier: "budget",
            durability_rating: 6,
            editorial_rating: 7,
            trip_type_suitability: ["overnight", "weekend"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png" },
          ],
          options: [{ title: "Color", values: ["Green", "Gray"] }],
          variants: [
            {
              title: "Green",
              sku: "NH-CLOUD-GRN",
              options: { Color: "Green" },
              prices: [{ amount: 14900, currency_code: "usd" }],
            },
            {
              title: "Gray",
              sku: "NH-CLOUD-GRY",
              options: { Color: "Gray" },
              prices: [{ amount: 14900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === SLEEPING BAGS ===
        {
          title: "Western Mountaineering NanoLite",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sleeping Bags")!.id,
          ],
          description: "Premium 850+ fill down bag. Incredibly light and packable for 3-season use.",
          handle: "western-mountaineering-nanolite",
          weight: 510,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["sleeping_bag"],
            weight_grams: 510,
            price_tier: "premium",
            durability_rating: 8,
            editorial_rating: 10,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png" },
          ],
          options: [{ title: "Size", values: ["Regular", "Long"] }],
          variants: [
            {
              title: "Regular",
              sku: "WM-NANO-REG",
              options: { Size: "Regular" },
              prices: [{ amount: 48000, currency_code: "usd" }],
            },
            {
              title: "Long",
              sku: "WM-NANO-LNG",
              options: { Size: "Long" },
              prices: [{ amount: 51000, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Enlightened Equipment Enigma Quilt",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sleeping Bags")!.id,
          ],
          description: "Backless quilt design eliminates redundant insulation. Custom temp ratings available.",
          handle: "ee-enigma-quilt",
          weight: 540,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["sleeping_bag"],
            weight_grams: 540,
            price_tier: "mid",
            durability_rating: 7,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png" },
          ],
          options: [{ title: "Temp Rating", values: ["20F", "30F", "40F"] }],
          variants: [
            {
              title: "20F",
              sku: "EE-ENIGMA-20",
              options: { "Temp Rating": "20F" },
              prices: [{ amount: 32000, currency_code: "usd" }],
            },
            {
              title: "30F",
              sku: "EE-ENIGMA-30",
              options: { "Temp Rating": "30F" },
              prices: [{ amount: 28000, currency_code: "usd" }],
            },
            {
              title: "40F",
              sku: "EE-ENIGMA-40",
              options: { "Temp Rating": "40F" },
              prices: [{ amount: 25000, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Sea to Summit Spark SP1",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sleeping Bags")!.id,
          ],
          description: "Budget ultralight sleeping bag for warm conditions.",
          handle: "s2s-spark-sp1",
          weight: 350,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["sleeping_bag"],
            weight_grams: 350,
            price_tier: "budget",
            durability_rating: 6,
            editorial_rating: 7,
            trip_type_suitability: ["overnight", "weekend"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png" },
          ],
          options: [{ title: "Size", values: ["Regular"] }],
          variants: [
            {
              title: "Regular",
              sku: "S2S-SPARK-SP1",
              options: { Size: "Regular" },
              prices: [{ amount: 18900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === SLEEPING PADS ===
        {
          title: "Therm-a-Rest NeoAir UberLite",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sleeping Pads")!.id,
          ],
          description: "The lightest air pad on the market. Incredible packability for bikepackers.",
          handle: "thermarest-neoair-uberlite",
          weight: 250,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["sleeping_pad"],
            weight_grams: 250,
            price_tier: "premium",
            durability_rating: 6,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png" },
          ],
          options: [{ title: "Size", values: ["Regular", "Large"] }],
          variants: [
            {
              title: "Regular",
              sku: "TAR-UBER-REG",
              options: { Size: "Regular" },
              prices: [{ amount: 19900, currency_code: "usd" }],
            },
            {
              title: "Large",
              sku: "TAR-UBER-LRG",
              options: { Size: "Large" },
              prices: [{ amount: 22900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Nemo Tensor Insulated",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sleeping Pads")!.id,
          ],
          description: "Quiet, comfortable pad with great warmth-to-weight ratio.",
          handle: "nemo-tensor-insulated",
          weight: 430,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["sleeping_pad"],
            weight_grams: 430,
            price_tier: "mid",
            durability_rating: 8,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png" },
          ],
          options: [{ title: "Size", values: ["Regular", "Long Wide"] }],
          variants: [
            {
              title: "Regular",
              sku: "NEMO-TENSOR-REG",
              options: { Size: "Regular" },
              prices: [{ amount: 17900, currency_code: "usd" }],
            },
            {
              title: "Long Wide",
              sku: "NEMO-TENSOR-LW",
              options: { Size: "Long Wide" },
              prices: [{ amount: 20900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Klymit Static V Lite",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Sleeping Pads")!.id,
          ],
          description: "Budget-friendly lightweight pad. V-chamber design for stability.",
          handle: "klymit-static-v-lite",
          weight: 490,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["sleeping_pad"],
            weight_grams: 490,
            price_tier: "budget",
            durability_rating: 7,
            editorial_rating: 7,
            trip_type_suitability: ["overnight", "weekend", "multi_day"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png" },
          ],
          options: [{ title: "Size", values: ["Regular"] }],
          variants: [
            {
              title: "Regular",
              sku: "KLYMIT-SV-LITE",
              options: { Size: "Regular" },
              prices: [{ amount: 7900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === STOVES ===
        {
          title: "MSR PocketRocket 2",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Stoves")!.id,
          ],
          description: "Ultralight canister stove. Fast boil times and reliable in wind.",
          handle: "msr-pocketrocket-2",
          weight: 73,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["stove"],
            weight_grams: 73,
            price_tier: "mid",
            durability_rating: 8,
            editorial_rating: 9,
            trip_type_suitability: ["weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png" },
          ],
          options: [{ title: "Type", values: ["Stove Only"] }],
          variants: [
            {
              title: "Stove Only",
              sku: "MSR-PR2",
              options: { Type: "Stove Only" },
              prices: [{ amount: 4500, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Soto WindMaster",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Stoves")!.id,
          ],
          description: "Premium wind-resistant stove with regulator for consistent performance.",
          handle: "soto-windmaster",
          weight: 67,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["stove"],
            weight_grams: 67,
            price_tier: "premium",
            durability_rating: 9,
            editorial_rating: 10,
            trip_type_suitability: ["weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png" },
          ],
          options: [{ title: "Type", values: ["Stove + 4-Flex Pot Support"] }],
          variants: [
            {
              title: "Stove + 4-Flex Pot Support",
              sku: "SOTO-WM-4FLEX",
              options: { Type: "Stove + 4-Flex Pot Support" },
              prices: [{ amount: 7900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "BRS-3000T Ultralight Stove",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Stoves")!.id,
          ],
          description: "Budget titanium stove. Incredibly light but less stable.",
          handle: "brs-3000t",
          weight: 25,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["stove"],
            weight_grams: 25,
            price_tier: "budget",
            durability_rating: 5,
            editorial_rating: 6,
            trip_type_suitability: ["weekend", "multi_day"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png" },
          ],
          options: [{ title: "Type", values: ["Stove Only"] }],
          variants: [
            {
              title: "Stove Only",
              sku: "BRS-3000T",
              options: { Type: "Stove Only" },
              prices: [{ amount: 1900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === COOK POTS ===
        {
          title: "Toaks Titanium 750ml Pot",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Cook Pots")!.id,
          ],
          description: "Classic titanium pot. Perfect size for solo cooking.",
          handle: "toaks-750ml-pot",
          weight: 103,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["cook_pot"],
            weight_grams: 103,
            price_tier: "mid",
            durability_rating: 9,
            editorial_rating: 9,
            trip_type_suitability: ["weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" },
          ],
          options: [{ title: "Size", values: ["750ml"] }],
          variants: [
            {
              title: "750ml",
              sku: "TOAKS-750",
              options: { Size: "750ml" },
              prices: [{ amount: 3400, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Sea to Summit Alpha Pot",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Cook Pots")!.id,
          ],
          description: "Aluminum pot with measuring marks and strainer lid.",
          handle: "s2s-alpha-pot",
          weight: 145,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["cook_pot"],
            weight_grams: 145,
            price_tier: "mid",
            durability_rating: 7,
            editorial_rating: 8,
            trip_type_suitability: ["weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" },
          ],
          options: [{ title: "Size", values: ["1.2L", "1.9L"] }],
          variants: [
            {
              title: "1.2L",
              sku: "S2S-ALPHA-1.2",
              options: { Size: "1.2L" },
              prices: [{ amount: 3900, currency_code: "usd" }],
            },
            {
              title: "1.9L",
              sku: "S2S-ALPHA-1.9",
              options: { Size: "1.9L" },
              prices: [{ amount: 4900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === GPS DEVICES ===
        {
          title: "Garmin Edge 540",
          category_ids: [
            categoryResult.find((cat) => cat.name === "GPS Devices")!.id,
          ],
          description: "Premium cycling GPS with maps and extended battery life.",
          handle: "garmin-edge-540",
          weight: 84,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["gps_device"],
            weight_grams: 84,
            price_tier: "premium",
            durability_rating: 8,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png" },
          ],
          options: [{ title: "Version", values: ["Standard", "Solar"] }],
          variants: [
            {
              title: "Standard",
              sku: "GARMIN-540",
              options: { Version: "Standard" },
              prices: [{ amount: 34900, currency_code: "usd" }],
            },
            {
              title: "Solar",
              sku: "GARMIN-540-SOL",
              options: { Version: "Solar" },
              prices: [{ amount: 44900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Wahoo ELEMNT BOLT V2",
          category_ids: [
            categoryResult.find((cat) => cat.name === "GPS Devices")!.id,
          ],
          description: "Aerodynamic GPS computer with excellent app integration.",
          handle: "wahoo-bolt-v2",
          weight: 68,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["gps_device"],
            weight_grams: 68,
            price_tier: "mid",
            durability_rating: 8,
            editorial_rating: 8,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png" },
          ],
          options: [{ title: "Color", values: ["Black"] }],
          variants: [
            {
              title: "Black",
              sku: "WAHOO-BOLT-V2",
              options: { Color: "Black" },
              prices: [{ amount: 29900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === TOOL KITS ===
        {
          title: "Crank Brothers M19 Multi-Tool",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Tool Kits")!.id,
          ],
          description: "Comprehensive multi-tool with 19 functions including chain breaker.",
          handle: "crankbros-m19",
          weight: 175,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["tool_kit"],
            weight_grams: 175,
            price_tier: "premium",
            durability_rating: 9,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" },
          ],
          options: [{ title: "Type", values: ["Standard"] }],
          variants: [
            {
              title: "Standard",
              sku: "CB-M19",
              options: { Type: "Standard" },
              prices: [{ amount: 4500, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Topeak Mini 20 Pro",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Tool Kits")!.id,
          ],
          description: "20-function tool with tire levers and chain tool. Gold standard.",
          handle: "topeak-mini-20-pro",
          weight: 150,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["tool_kit"],
            weight_grams: 150,
            price_tier: "mid",
            durability_rating: 8,
            editorial_rating: 9,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" },
          ],
          options: [{ title: "Type", values: ["Standard"] }],
          variants: [
            {
              title: "Standard",
              sku: "TOPEAK-M20P",
              options: { Type: "Standard" },
              prices: [{ amount: 3500, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "Essential Tool Kit",
          category_ids: [
            categoryResult.find((cat) => cat.name === "Tool Kits")!.id,
          ],
          description: "Minimal multi-tool, patches, and chain link. Fits in a feed bag.",
          handle: "essential-tool-kit",
          weight: 95,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["tool_kit"],
            weight_grams: 95,
            price_tier: "budget",
            durability_rating: 6,
            editorial_rating: 7,
            trip_type_suitability: ["overnight", "weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" },
          ],
          options: [{ title: "Size", values: ["One Size"] }],
          variants: [
            {
              title: "One Size",
              sku: "TOOLKIT-ESS",
              options: { Size: "One Size" },
              prices: [{ amount: 2800, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },

        // === FIRST AID ===
        {
          title: "Adventure Medical Ultralight .7",
          category_ids: [
            categoryResult.find((cat) => cat.name === "First Aid")!.id,
          ],
          description: "Comprehensive first aid kit for 1-4 people on multi-day trips.",
          handle: "amk-ultralight-7",
          weight: 200,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["first_aid"],
            weight_grams: 200,
            price_tier: "mid",
            durability_rating: 8,
            editorial_rating: 9,
            trip_type_suitability: ["weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png" },
          ],
          options: [{ title: "Size", values: ["Standard"] }],
          variants: [
            {
              title: "Standard",
              sku: "AMK-UL7",
              options: { Size: "Standard" },
              prices: [{ amount: 3900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
        {
          title: "MyMedic Solo First Aid Kit",
          category_ids: [
            categoryResult.find((cat) => cat.name === "First Aid")!.id,
          ],
          description: "Premium solo first aid kit with trauma supplies.",
          handle: "mymedic-solo",
          weight: 280,
          status: ProductStatus.PUBLISHED,
          shipping_profile_id: shippingProfile.id,
          metadata: {
            kit_slots: ["first_aid"],
            weight_grams: 280,
            price_tier: "premium",
            durability_rating: 9,
            editorial_rating: 8,
            trip_type_suitability: ["weekend", "multi_day", "expedition"],
          },
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png" },
          ],
          options: [{ title: "Color", values: ["Black", "Orange"] }],
          variants: [
            {
              title: "Black",
              sku: "MYMED-SOLO-BLK",
              options: { Color: "Black" },
              prices: [{ amount: 6900, currency_code: "usd" }],
            },
            {
              title: "Orange",
              sku: "MYMED-SOLO-ORG",
              options: { Color: "Orange" },
              prices: [{ amount: 6900, currency_code: "usd" }],
            },
          ],
          sales_channels: [{ id: defaultSalesChannel[0].id }],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Seeding inventory levels.");

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });

  const inventoryLevels: CreateInventoryLevelInput[] = [];
  for (const inventoryItem of inventoryItems) {
    const inventoryLevel = {
      location_id: stockLocation.id,
      stocked_quantity: 1000000,
      inventory_item_id: inventoryItem.id,
    };
    inventoryLevels.push(inventoryLevel);
  }

  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryLevels,
    },
  });

  logger.info("Finished seeding inventory levels data.");
}
