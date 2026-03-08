FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/medusa/package.json ./packages/medusa/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/medusa ./packages/medusa

# Build the application
WORKDIR /app/packages/medusa
RUN pnpm build

# Production image
FROM node:20-alpine AS production

RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001 -G nodejs

WORKDIR /app/packages/medusa

# Copy built application
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/packages/medusa /app/packages/medusa

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 9000

CMD ["pnpm", "start"]
