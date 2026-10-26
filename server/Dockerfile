# Base image ให้ทุก stage ใช้ร่วมกัน
FROM oven/bun:1-alpine AS base
WORKDIR /app


# ติดตั้ง dependencies ทั้งหมด (รวม dev) เพราะ prisma CLI อยู่ใน devDependencies ต้องใช้ตอน generate
FROM base AS deps
COPY package.json bun.lock ./
COPY prisma ./prisma
RUN bun install --frozen-lockfile


# generate Prisma Client จาก schema
FROM deps AS build
COPY . .
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db"
RUN bunx prisma generate


# ติดตั้งเฉพาะ production dependencies แยกต่างหาก ไม่มี devDependencies ติดมาด้วยเลย
FROM base AS prod-deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts


# Production image: ใช้ node_modules สะอาดจาก prod-deps แล้วเอา Prisma Client ที่ generate ไว้มาแปะทับ
FROM base AS production
ENV NODE_ENV=production

# สร้าง user แยกจาก root ไว้รันแอพ ลดสิทธิ์ถ้า container โดนเจาะ
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./package.json

# เปลี่ยนเจ้าของไฟล์ให้ user ที่สร้างไว้ แล้วสลับมารันด้วย user นี้แทน root
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]