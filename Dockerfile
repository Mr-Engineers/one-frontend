FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

ENV BACKEND_URL=http://127.0.0.1:8000 \
    DNS_RESOLVER=169.254.169.253

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]