# Production Multi-Stage Dockerfile for AI Career Assistant
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests and dependencies
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci

COPY backend/package*.json ./backend/
RUN cd backend && npm ci

# Copy full source
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend and backend
RUN cd frontend && npm run build
RUN cd backend && npx prisma generate && npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/node_modules/.prisma ./backend/node_modules/.prisma
COPY --from=builder /app/frontend/dist ./frontend/dist

EXPOSE 5000

CMD ["node", "backend/dist/index.js"]
