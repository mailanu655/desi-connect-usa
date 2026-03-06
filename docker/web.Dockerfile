# ─────────────────────────────────────────────────────────────
# Desi Connect USA — Web Application (Next.js)
# Multi-stage build with standalone output
# ─────────────────────────────────────────────────────────────

# ── Stage 1: Install Dependencies ──────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy workspace root files
COPY package.json package-lock.json* ./

# Copy package manifests for all workspace packages
COPY packages/shared/package.json ./packages/shared/
COPY packages/database/package.json ./packages/database/
COPY packages/web/package.json ./packages/web/

# Install all dependencies (need devDeps for build)
RUN npm ci --ignore-scripts

# ── Stage 2: Build ─────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/database/node_modules ./packages/database/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/web/node_modules ./packages/web/node_modules 2>/dev/null || true

# Copy source for shared, database, and web
COPY package.json tsconfig.json ./
COPY packages/shared/ ./packages/shared/
COPY packages/database/ ./packages/database/
COPY packages/web/ ./packages/web/

# Build dependencies first, then the Next.js app
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build -w packages/shared && \
    npm run build -w packages/database && \
    npm run build -w packages/web

# ── Stage 3: Production ───────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy Next.js standalone build (if configured) or full build
COPY --from=builder /app/packages/web/.next ./packages/web/.next
COPY --from=builder /app/packages/web/public ./packages/web/public
COPY --from=builder /app/packages/web/package.json ./packages/web/

# Copy shared/database dist for runtime imports
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/package.json ./packages/database/

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "start", "-w", "packages/web"]
