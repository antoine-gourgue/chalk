# syntax=docker/dockerfile:1

# --- Dependencies (incl. dev, needed for the build) ---
FROM node:26-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# --- Build the Next.js standalone output ---
FROM node:26-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Non-secret placeholders so env validation passes; the build never touches the
# database and these values are not used at runtime.
ENV DATABASE_URL="postgresql://localhost:5432/build"
ENV AUTH_SECRET="placeholder"
# Public (NEXT_PUBLIC_*) values are inlined into the client bundle at build time,
# so they must be passed as build args — runtime env cannot change them.
ARG NEXT_PUBLIC_APP_URL=""
ARG NEXT_PUBLIC_REALTIME_URL=""
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_REALTIME_URL=$NEXT_PUBLIC_REALTIME_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# --- Production runtime (standalone server) ---
FROM node:26-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]

# --- Realtime gateway (socket.io: timer + live leaderboard) ---
FROM node:26-alpine AS realtime
WORKDIR /app
ENV NODE_ENV=production
ENV REALTIME_PORT=3100
COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY realtime ./realtime
COPY src ./src
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs
USER nextjs
EXPOSE 3100
CMD ["npx", "tsx", "realtime/index.ts"]

# --- Migration runner (Prisma CLI + schema + migrations) ---
FROM node:26-alpine AS migrator
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json prisma.config.ts ./
COPY prisma ./prisma
CMD ["npx", "prisma", "migrate", "deploy"]
