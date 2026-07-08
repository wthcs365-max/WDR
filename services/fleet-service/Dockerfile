FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/fleet-service/ services/fleet-service/
RUN npm install
RUN npm run build -w services/fleet-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/fleet-service/package*.json ./services/fleet-service/
COPY --from=builder /app/services/fleet-service/dist ./services/fleet-service/dist
RUN npm install --omit=dev -w services/fleet-service
EXPOSE 4002
CMD ["npm", "start", "-w", "services/fleet-service"]