# syntax=docker/dockerfile:1

# === Stage 1: Dependencies ===
FROM node:22-alpine AS deps

WORKDIR /app

# Copy dependency manifests first for layer caching
COPY package.json package-lock.json ./

RUN npm ci

# === Stage 2: Builder — build the Next.js app ===
FROM node:22-alpine AS builder

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# === Stage 3: Runtime — minimal image ===
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server output
COPY --from=builder /app/.next/standalone ./

# Copy static assets and public files
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
