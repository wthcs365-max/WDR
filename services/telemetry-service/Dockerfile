FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/telemetry-service/ services/telemetry-service/
RUN npm install
RUN npm run build -w services/telemetry-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/telemetry-service/package*.json ./services/telemetry-service/
COPY --from=builder /app/services/telemetry-service/dist ./services/telemetry-service/dist
RUN npm install --omit=dev -w services/telemetry-service
EXPOSE 4006
CMD ["npm", "start", "-w", "services/telemetry-service"]