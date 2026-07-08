FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/trust-service/ services/trust-service/
RUN npm install
RUN npm run build -w services/trust-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/trust-service/package*.json ./services/trust-service/
COPY --from=builder /app/services/trust-service/dist ./services/trust-service/dist
RUN npm install --omit=dev -w services/trust-service
EXPOSE 4005
CMD ["npm", "start", "-w", "services/trust-service"]