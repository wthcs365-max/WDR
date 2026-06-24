FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./
COPY packages/ packages/
COPY services/api-gateway/ services/api-gateway/

RUN npm install
RUN npm run build -w services/api-gateway

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/services/api-gateway/package*.json ./services/api-gateway/
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist

RUN npm install --omit=dev -w services/api-gateway

EXPOSE 4050

CMD ["npm", "start", "-w", "services/api-gateway"]
