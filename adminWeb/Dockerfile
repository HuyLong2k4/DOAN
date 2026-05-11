# syntax=docker/dockerfile:1
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# VITE_API_URL được inject lúc build (vite bake env vào bundle).
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

# PORT mặc định 80 (local). Railway sẽ override bằng env PORT.
ENV PORT=80

RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Nginx official image tự động chạy envsubst trên file *.template trong /etc/nginx/templates
# và output ra /etc/nginx/conf.d/ trước khi start.
EXPOSE 80
