# Build React app ด้วย Bun แทน Node/npm
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package.json และ lockfile ก่อนแยกจาก source เพื่อให้ Docker cache layer นี้ไว้ ไม่ต้อง install ใหม่ทุกครั้งที่โค้ดเปลี่ยน
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source ที่เหลือแล้ว build เป็น static files
COPY . .
RUN bun run build


# Serve static files ด้วย nginx (image เบา ไม่มี Bun/source code ติดไปด้วย)
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80