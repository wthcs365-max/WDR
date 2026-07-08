FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/partner-service/ services/partner-service/
RUN npm install
RUN npm run build -w services/partner-service

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/partner-service/package*.json ./services/partner-service/
COPY --from=builder /app/services/partner-service/dist ./services/partner-service/dist
RUN npm install --omit=dev -w services/partner-service
EXPOSE 4010
CMD ["npm", "start", "-w", "services/partner-service"]