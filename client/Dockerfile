# ─── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Set env var for build if needed
ARG VITE_API_URL=http://localhost:5000/api
ENV VITE_API_URL=$VITE_API_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Stage 2: Production Web Server ────────────────────────────────────────
FROM nginx:alpine

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy built static files from builder stage
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Add custom NGINX config for React Router
RUN echo 'server { \
    listen 5173; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
