# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/ .
RUN npm run build

# Final stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm install --production
EXPOSE 3001
CMD ["node", "dist/index.js"]
