# Build
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --include=dev

COPY . .

RUN npm run prisma:generate
RUN npm run build

# Production
FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/data/models/prisma ./src/data/models/prisma

ENV NODE_ENV=production
EXPOSE 80

CMD [ "node", "dist/main.js" ]
