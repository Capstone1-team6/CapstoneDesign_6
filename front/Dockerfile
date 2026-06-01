FROM node:20-alpine AS build

WORKDIR /app

# Force dev dependencies (tsc, vite) even if NODE_ENV=production is set
ENV NODE_ENV=development

COPY front/package*.json ./
RUN npm ci --include=dev

COPY front ./
RUN npm run build

FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
