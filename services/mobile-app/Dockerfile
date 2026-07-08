FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY packages/ packages/
COPY services/mobile-app/ services/mobile-app/
RUN npm install
RUN npm run build -w services/mobile-app

FROM nginx:alpine
COPY --from=builder /app/services/mobile-app/dist /usr/share/nginx/html
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]