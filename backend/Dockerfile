# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Tạo sẵn thư mục uploads. Khi Railway mount volume vào /app/uploads,
# volume sẽ chiếm chỗ này và container (chạy root) có quyền tạo subfolder.
RUN mkdir -p /app/uploads/avatars /app/uploads/chat /app/uploads/donations

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:5000/health || exit 1

CMD ["node", "src/server.js"]
