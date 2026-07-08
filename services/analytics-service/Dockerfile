FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/analytics-service/ services/analytics-service/
RUN npm install
RUN npm run build -w services/analytics-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/analytics-service/package*.json ./services/analytics-service/
COPY --from=builder /app/services/analytics-service/dist ./services/analytics-service/dist
RUN npm install --omit=dev -w services/analytics-service
EXPOSE 4009
CMD ["npm", "start", "-w", "services/analytics-service"]