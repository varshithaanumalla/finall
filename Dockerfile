FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code (will be overridden by bind mount in dev)
COPY . .

# Expose port
EXPOSE 5000

# Run with nodemon for hot reload
CMD ["npx", "nodemon", "index.js"]
