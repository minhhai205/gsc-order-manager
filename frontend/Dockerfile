# ========================================================
# STAGE 1: BUILD STATIC BUNDLE
# ========================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package lock and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build static output
COPY . .
RUN npm run build

# ========================================================
# STAGE 2: WEB HOSTING WITH NGINX
# ========================================================
FROM nginx:stable-alpine

# Copy built bundle from stage 1 to nginx public directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration for routing and proxies
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
