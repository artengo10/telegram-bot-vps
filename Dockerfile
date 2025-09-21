FROM node:18-slim

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    make \
    g++ \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Копируем только package файлы для кэширования зависимостей
COPY package*.json ./

# Устанавливаем зависимости внутри контейнера
RUN npm install --omit=dev

# Создаем папку для базы данных
RUN mkdir -p /app/database && chmod 777 /app/database

# Копируем исходный код
COPY . .

CMD ["node", "bot.js"]