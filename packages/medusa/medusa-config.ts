import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const isProduction = process.env.NODE_ENV === 'production'
const defaultSecret = "supersecret"

if (isProduction) {
  const jwtSecret = process.env.JWT_SECRET || defaultSecret
  const cookieSecret = process.env.COOKIE_SECRET || defaultSecret
  if (jwtSecret === defaultSecret || cookieSecret === defaultSecret) {
    throw new Error(
      "Production requires JWT_SECRET and COOKIE_SECRET to be set and different from default"
    )
  }
}

const config = defineConfig({
  admin: {},
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: isProduction
      ? { ssl: { rejectUnauthorized: false } }
      : { ssl: false },
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || defaultSecret,
      cookieSecret: process.env.COOKIE_SECRET || defaultSecret,
    }
  },
  modules: [
    { key: "productEditorial", resolve: "./src/modules/product-editorial" },
    { key: "kitBuilder", resolve: "./src/modules/kit-builder" },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
            },
          },
        ],
      },
    },
  ],
})

export default config
module.exports = config
