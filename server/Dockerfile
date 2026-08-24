# ─── Stage 1: Build ────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies first (leverage Docker cache)
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# ─── Stage 2: Production ───────────────────────────────────────────────────
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Set production environment
ENV NODE_ENV=production

# Copy only production dependencies to keep image small
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled JavaScript from builder
COPY --from=builder /usr/src/app/dist ./dist

# Start the application
CMD ["node", "dist/app.js"]
EXPOSE 5000