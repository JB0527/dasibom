# Frontend Dockerfile for React/Vue.js application
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 80

# Use vite preview to serve the built files
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "80"]