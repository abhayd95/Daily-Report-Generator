# Multi-stage build for production
FROM node:18-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

FROM node:18-alpine

WORKDIR /app

# Copy backend dependencies and source
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend/ ./backend/

# Copy frontend build
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Install serve for frontend
RUN npm install -g serve

# Create backups directory
RUN mkdir -p /app/backups

EXPOSE 5000 3000

# Start both backend and frontend
CMD ["sh", "-c", "node backend/server.js & serve -s frontend/dist -l 3000 & wait"]

