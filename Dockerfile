# Multi-stage build for React Native/Expo mobile app
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Development stage
FROM base AS development

ENV NODE_ENV=development

# Copy source code
COPY . .

# Expose port for Expo
EXPOSE 19000
EXPOSE 19001
EXPOSE 19006

# Start development server
CMD ["npm", "start"]

# Production build stage
FROM base AS builder

ENV NODE_ENV=production

# Copy source code
COPY . .

# Build the app for production
RUN npm run build

# Production stage - for serving built web version
FROM nginx:alpine AS production

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Testing stage
FROM base AS testing

ENV NODE_ENV=test

# Install test dependencies
RUN npm ci

# Copy source code
COPY . .

# Run tests
CMD ["npm", "test"]