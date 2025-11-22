# Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Сначала устанавливаем все зависимости (включая dev)
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение
RUN npm run build

# Стадия production
FROM nginx:alpine

# Копируем собранное приложение в nginx
COPY --from=build /app/build /usr/share/nginx/html

# Копируем кастомную конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]