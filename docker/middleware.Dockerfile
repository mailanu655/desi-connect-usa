# ─────────────────────────────────────────────────────────────
# Desi Connect USA — Middleware Service
# Multi-stage build for WhatsApp bot + API middleware
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Install Dependencies ──────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* ./

# Copy package manifests for all workspace packages
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/middleware/package.json ./packages/middleware/

# Install production + dev dependencies (need devDeps for build)
RUN npm ci --ignore-scripts

# ── Stage 2: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/middleware/node_modules ./packages/middleware/node_modules 2>/dev/null || true

# Copy source for shared, database, and middleware
COPY package.json tsconfig.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/database/ ./packages/database/
COPY packages/middleware/ ./packages/middleware/

# Build in dependency order
RUN npm run build -w packages/shared && \
    npm run build -w packages/database && \
    npm run build -w packages/middleware

# ── Stage 3: Production ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 middleware

# Copy built artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/middleware/dist ./packages/middleware/dist
COPY --from=builder /app/packages/middleware/package.json ./packages/middleware/

# Install production dependencies only
COPY package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

USER middleware

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "packages/middleware/dist/server.js"]
