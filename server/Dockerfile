# ---- Base image ----
FROM oven/bun:1-alpine AS base
WORKDIR /app

# ---- Install dependencies ----
FROM base AS deps
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile

# ---- Generate Prisma Client ----
FROM deps AS build
COPY . .
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN bunx prisma generate

# ---- Production image ----
FROM base AS production
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]