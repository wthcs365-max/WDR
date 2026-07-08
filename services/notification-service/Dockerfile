FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/notification-service/ services/notification-service/
RUN npm install
RUN npm run build -w services/notification-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/notification-service/package*.json ./services/notification-service/
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist
RUN npm install --omit=dev -w services/notification-service
EXPOSE 4008
CMD ["npm", "start", "-w", "services/notification-service"]