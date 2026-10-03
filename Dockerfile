FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

# Vite inlines VITE_* into the bundle at build time, so they must be set here
# (CI passes them from SSM Parameter Store with --build-arg)
ARG VITE_API_BASE_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
RUN npm run build

FROM nginx:alpine
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html

# Overridden by the ECS task definition (Terraform: backend_internal_url)
ENV BACKEND_URL=http://backend:8000

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]