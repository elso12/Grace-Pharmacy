# /server/Dockerfile

# Use official Node.js image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
# (This will fail if you haven't created package.json yet!)
COPY package*.json ./
RUN npm install

# Copy the rest of the backend code
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server (assuming you will use a dev script)
CMD ["npm", "run", "dev"]