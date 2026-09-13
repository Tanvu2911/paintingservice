# ==========================================
# Stage 1: Build React App with Vite
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install project dependencies
COPY package*.json ./
RUN npm ci

# Copy application source
COPY . .

# Build Arguments for environment configuration
ARG VITE_MAPBOX_TOKEN=""
ARG VITE_API_URL=/api

ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_API_URL=$VITE_API_URL

# Build production bundle
RUN npm run build

# ==========================================
# Stage 2: Serve with Nginx Alpine
# ==========================================
FROM nginx:1.25-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
