FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/booking-service/ services/booking-service/
RUN npm install
RUN npm run build -w services/booking-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/booking-service/package*.json ./services/booking-service/
COPY --from=builder /app/services/booking-service/dist ./services/booking-service/dist
RUN npm install --omit=dev -w services/booking-service
EXPOSE 4003
CMD ["npm", "start", "-w", "services/booking-service"]