FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/subscription-service/ services/subscription-service/
RUN npm install
RUN npm run build -w services/subscription-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/subscription-service/package*.json ./services/subscription-service/
COPY --from=builder /app/services/subscription-service/dist ./services/subscription-service/dist
RUN npm install --omit=dev -w services/subscription-service
EXPOSE 4007
CMD ["npm", "start", "-w", "services/subscription-service"]