# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production image ────────────────────────────────────────────────
FROM node:18-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/
COPY scripts/ ./scripts/

# Own files as non-root user
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/index.js"]
