# /client/Dockerfile

# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
# (This will fail if you haven't created package.json yet!)
COPY package*.json ./
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose the Vite port
EXPOSE 5173

# Start the frontend
CMD ["npm", "run", "dev"]
