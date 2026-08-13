# ── TarshishDEX — multi-stage production image ─────────────────────────
# Stage 1: install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++ linux-headers eudev-dev
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: build the Next.js app (standalone output)
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: minimal runtime image using the standalone server
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Healthcheck: verify the server responds on the health endpoint.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]

# Set runtime environment variables with sensible defaults.
ENV NEXT_PUBLIC_STELLAR_NETWORK=testnet
