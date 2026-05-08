# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:18-alpine AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: Build the Next.js app ──────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time env vars (overridable via docker-compose build args)
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ── Stage 3: Production image ───────────────────────────────────────────────
FROM node:18-alpine

# Security: run as non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only what's needed to run
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
