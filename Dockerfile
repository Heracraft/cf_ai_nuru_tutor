# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

# --- Dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
# strict-dep-builds off: the only ignored build scripts here are esbuild, msw,
# and sharp, none of which this app needs at runtime. It does not use
# next/image, so sharp buys nothing.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
	pnpm config set store-dir /pnpm/store && \
	pnpm config set strict-dep-builds false && \
	pnpm install --frozen-lockfile

# --- Build ------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# lib/ai.ts and lib/db skip their eager config checks in this phase, so the
# build needs no credentials of any kind.
ENV NEXT_PHASE=phase-production-build

RUN pnpm build

# --- Runtime ----------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
	adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Standalone output carries only the traced dependencies.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrations run at container start, so the SQL and the two packages the
# migrate script needs have to be present. Dependency tracing does not pick
# these up, since no page imports the migrator.
COPY --from=builder --chown=nextjs:nodejs /app/migrations ./migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
