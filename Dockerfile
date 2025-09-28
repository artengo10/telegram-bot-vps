FROM node:20-alpine

WORKDIR /app

# Устанавливаем зависимости для ffmpeg и других нативных пакетов
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код
COPY . .

# Создаем директорию для временных файлов
RUN mkdir -p /tmp

# Запускаем приложение
CMD ["node", "bot.js"]