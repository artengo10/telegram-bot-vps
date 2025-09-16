
const { Bot } = require("grammy");
const express = require("express");
const { userService, getSystemPrompt } = require("./services/userProfile");
const { askGigaChat } = require("./services/gigaChat");
const { initDatabase } = require("./database/db");
const externalData = require("./services/externalData");
const path = require("path");
const {
  addRow,
  writeToCell,
  writeToRange,
} = require("./services/googleSheets");

// Загрузка переменных окружения
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON (обязательно для вебхуков!)
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Bot is running!" });
});

// Инициализация бота
const bot = new Bot(process.env.BOT_TOKEN);

// Добавляем обработчики команд и сообщений
bot.command("start", (ctx) => {
  console.log("✅ Команда /start получена от пользователя:", ctx.from.id);
  ctx.reply(`🤖 Бот запущен! Поддерживаются голосовые сообщения 🎤

Как работать с голосовыми сообщениями:
1. Отправьте голосовое сообщение
2. Нажмите на него и выберите "Распознать речь"
3. Скопируйте распознанный текст и отправьте его боту

Доступные команды:
/currency - Все валюты
/crypto - Все криптовалюты  
/weather - Погода
/add - Добавить запись в таблицу (формат: /add A1 Текст)
/clear - Очистить историю`);
});

bot.command("currency", async (ctx) => {
  console.log("✅ Команда /currency получена");
  const data = await externalData.currencyService.getCurrencyDataFormatted();
  await ctx.reply(data || "Не удалось получить данные о валютах");
});

bot.command("crypto", async (ctx) => {
  console.log("✅ Команда /crypto получена");
  const data = await externalData.cryptoService.getCryptoDataFormatted();
  await ctx.reply(data || "Не удалось получить данных о криптовалютах");
});

bot.command("weather", async (ctx) => {
  console.log("✅ Команда /weather получена");
  const weather = await externalData.weatherService.getWeatherDataFormatted();
  await ctx.reply(weather);
});

bot.command("add", async (ctx) => {
  console.log("✅ Команда /add получена:", ctx.message.text);
  const args = ctx.message.text.split(" ");

  if (args.length < 3) {
    console.log("❌ Неверный формат команды /add");
    await ctx.reply(
      "❌ Формат команды: /add [ячейка] [текст]\nНапример: /add B1 Привет мир\nИли: /add A1 Артем"
    );
    return;
  }

  const cell = args[1].toUpperCase();
  const text = args.slice(2).join(" ");

  console.log(`📝 Пытаюсь записать в ячейку ${cell}: "${text}"`);

  try {
    const success = await writeToCell(cell, text);

    if (success) {
      console.log(`✅ Успешно записано в ${cell}`);
      await ctx.reply(`✅ Текст "${text}" успешно записан в ячейку ${cell}!`);
    } else {
      console.log(`❌ Ошибка записи в ${cell}`);
      await ctx.reply(
        "❌ Ошибка! Не удалось записать в ячейку. Смотри логи бота."
      );
    }
  } catch (error) {
    console.error("💥 Критическая ошибка в /add:", error);
    await ctx.reply("💥 Произошла критическая ошибка при записи в таблицу");
  }
});

bot.command("clear", async (ctx) => {
  console.log("✅ Команда /clear получена");
  await userService.clearHistory(ctx.from.id);
  await ctx.reply("🗑️ История диалога очищена!");
});

bot.command("debug_voice", async (ctx) => {
  console.log("✅ Команда /debug_voice получена");
  if (ctx.message.reply_to_message && ctx.message.reply_to_message.voice) {
    const voiceMsg = ctx.message.reply_to_message;
    await ctx.reply(
      `Структура голосового сообщения:\n${JSON.stringify(voiceMsg, null, 2)}`
    );
  } else {
    await ctx.reply(
      "Ответьте этой командой на голосовое сообщение для диагностики"
    );
  }
});

// ОБЩИЙ ОБРАБОТЧИК СООБЩЕНИЙ
bot.on("message", async (ctx) => {
  console.log("📨 Получено сообщение от пользователя:", ctx.from.id);

  if (ctx.from.id !== parseInt(process.env.YOUR_USER_ID)) {
    console.log(
      "🔒 Попытка доступа от неавторизованного пользователя:",
      ctx.from.id
    );
    return ctx.reply("🔒 Доступ ограничен");
  }

  // Если сообщение уже обработано как команда - выходим
  if (ctx.message.text && ctx.message.text.startsWith("/")) {
    console.log("⚡ Сообщение начинается с /, пропускаем общий обработчик");
    return;
  }

  // Обработка голосовых сообщений
  if (ctx.message.voice) {
    console.log("🎤 Получено голосовое сообщение");
    try {
      await ctx.reply(
        '🎤 Голосовое сообщение получено! \n\nЧтобы я мог его обработать, пожалуйста:\n1. Нажмите на голосовое сообщение\n2. Выберите "Распознать речь"\n3. Скопируйте распознанный текст\n4. Отправьте его мне как текстовое сообщение'
      );
      return;
    } catch (error) {
      console.error("Ошибка обработки голосового:", error);
      await ctx.reply("❌ Ошибка обработки голосового сообщения");
      return;
    }
  }

  // Обработка пересланных сообщений
  if (ctx.message.forward_from_message_id && ctx.message.text) {
    console.log("📨 Получено пересланное сообщение");
    try {
      const originalMessage = await ctx.api.getMessage(
        ctx.chat.id,
        ctx.message.forward_from_message_id
      );

      if (originalMessage.voice && ctx.message.text) {
        await processTextMessage(ctx, ctx.message.text);
        return;
      }
    } catch (error) {
      console.error("Ошибка обработки пересланного сообщения:", error);
    }
  }

  // Обработка обычных текстовых сообщений
  if (ctx.message.text) {
    console.log("📝 Текстовое сообщение:", ctx.message.text);
    await processTextMessage(ctx, ctx.message.text);
  }
});

// Функция обработки текстовых сообщений
async function processTextMessage(ctx, text) {
  const userId = ctx.from.id;
  console.log("🔧 Обработка текстового сообщения:", text);

  try {
    const preciseData = await externalData.getPreciseData(text);

    if (preciseData) {
      console.log("📊 Найдены точные данные для ответа");
      await ctx.reply(preciseData);
      await userService.addToHistory(userId, text, "user");
      await userService.addToHistory(userId, preciseData, "assistant");
      return;
    }

    console.log("🤖 Передаю запрос нейросети GigaChat");
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    await userService.addToHistory(userId, text, "user");
    const history = await userService.getChatHistory(userId);
    const messages = [getSystemPrompt(), ...history];

    const aiResponse = await askGigaChat(messages);
    await userService.addToHistory(userId, aiResponse, "assistant");
    await ctx.reply(aiResponse);
  } catch (error) {
    console.error("❌ Ошибка обработки:", error);
    await ctx.reply("❌ Произошла ошибка при обработке запроса");
  }
}

// Обработчик ошибок бота
bot.catch((error) => {
  console.error("❌ Ошибка в обработчике бота:", error);
});

async function startBot() {
  try {
    console.log("🔄 Инициализация базы данных...");
    await initDatabase();
    await userService.init();
    console.log("✅ База данных готова");

    // Тестируем подключение к Google Sheets
    console.log("🔄 Тестирование подключения к Google Sheets...");
    try {
      const testWrite = await writeToCell("A1", "Test connection");
      if (testWrite) {
        console.log("✅ Google Sheets подключение успешно");
      } else {
        console.log("❌ Google Sheets: запись не удалась");
      }
    } catch (error) {
      console.error("❌ Ошибка подключения к Google Sheets:", error.message);
    }

    // 🔥 ВЫБОР РЕЖИМА РАБОТЫ В ЗАВИСИМОСТИ ОТ ОКРУЖЕНИЯ
    if (process.env.NODE_ENV === "production") {
      // РЕЖИМ ДЛЯ СЕРВЕРА (ВЕБХУКИ)
      console.log("🌐 Используется режим Webhook для продакшена");

      // Устанавливаем вебхук
      const webhookUrl = `${process.env.RENDER_EXTERNAL_URL}/webhook`;
      await bot.api.setWebhook(webhookUrl);
      console.log(`✅ Вебхук установлен на: ${webhookUrl}`);

      // Настраиваем обработчик вебхуков
      app.use("/webhook", (req, res) => {
        try {
          bot.handleUpdate(req.body, res);
        } catch (error) {
          console.error("Error handling update:", error);
          res.status(500).send("Error");
        }
      });
    } else {
      // РЕЖИМ ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ (ЛОНГ-ПОЛЛИНГ)
      console.log("🤖 Используется Long Polling для локальной разработки");
      await bot.start();
      console.log("✅ Бот успешно запущен в режиме polling");
    }
  } catch (error) {
    console.error("💥 Критическая ошибка при запуске бота:", error);
    process.exit(1);
  }
}

// Запускаем серсер
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startBot().catch(console.error);
});

// Единые обработчики завершения процесса
function setupProcessHandlers() {
  process.on("SIGINT", () => {
    console.log("\n🛑 Остановка бота...");
    server.close(() => {
      process.exit(0);
    });
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Получен сигнал завершения...");
    server.close(() => {
      process.exit(0);
    });
  });
}

setupProcessHandlers();
