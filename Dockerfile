# Stage 1: Build the client
FROM node:18-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build the server
FROM node:18-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build

# Stage 3: Production Environment
FROM node:18-alpine
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy server dependencies and built code
COPY --from=server-build /app/server/package*.json ./server/
WORKDIR /app/server
RUN npm install --only=production
COPY --from=server-build /app/server/dist ./dist

# Copy built client code to be served by Express
COPY --from=client-build /app/client/dist /app/client/dist

# Expose the API port
EXPOSE 5000

# Start the Node server
CMD ["node", "dist/server.js"]
