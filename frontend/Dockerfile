# frontend/Dockerfile
FROM node:20-alpine as build

WORKDIR /app

# Сначала копируем только package файлы
COPY package*.json ./
COPY package-lock.json* ./

# Используем npm install вместо npm ci, чтобы избежать ошибок синхронизации
RUN npm install

# Затем копируем остальные файлы
COPY . .

RUN npm run build

# Используем Nginx для раздачи статики
FROM nginx:alpine

# Копируем собранные файлы
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80