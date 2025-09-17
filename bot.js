const { Bot, Keyboard, InlineKeyboard } = require("grammy");
const express = require("express");

// Правильные импорты
const { pingServer } = require("./ping");
const { initDatabase } = require("./database/db");
const { userService, getSystemPrompt } = require("./services/userProfile");
const { askGigaChat } = require("./services/gigaChat");
const currencyService = require("./services/currencyService");
const cryptoService = require("./services/cryptoService");
const weatherService = require("./services/weatherService");
const externalDataService = require("./services/externalData");
const { writeToCell } = require("./services/googleSheets");

// Загрузка переменных окружения
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware для парсинга JSON
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "Bot is running!" });
});

// Инициализация бота
const bot = new Bot(process.env.BOT_TOKEN);

// Создаем клавиатуру с кнопками
function createMainKeyboard() {
  return new Keyboard()
    .text("💰 Курсы валют")
    .text("₿ Криптовалюты")
    .row()
    .text("🌤️ Погода")
    .text("📊 Google Таблица")
    .row()
    .text("🧹 Очистить историю")
    .text("ℹ️ Помощь")
    .resized()
    .persistent(); // Клавиатура остается открытой
}

// Команда /start
bot.command("start", async (ctx) => {
  console.log("✅ Команда /start получена от пользователя:", ctx.from.id);

  const welcomeText = `🤖 <b>Добро пожаловать!</b> Я ваш AI-ассистент с расширенными функциями.

🎯 <b>Доступные команды:</b>
/currency - Курсы валют ЦБ РФ
/crypto - Топ-10 криптовалют
/weather - Прогноз погоды
/add - Запись в таблицу (формат: /add A1 Текст)
/clear - Очистить историю диалога
/help - Справка

💡 <b>Или используйте кнопки ниже</b> - это еще удобнее!`;

  await ctx.reply(welcomeText, {
    parse_mode: "HTML",
    reply_markup: createMainKeyboard(),
  });
});

// Команда /help
bot.command("help", async (ctx) => {
  await ctx.reply(
    `🎯 <b>Доступные команды:</b>

/currency - Актуальные курсы валют ЦБ РФ
/crypto - Топ-10 криптовалют
/weather - Прогноз погоды
/add [ячейка] [текст] - Запись в Google Таблицу
/clear - Очистить историю диалога
/help - Эта справка

💡 <b>Или используйте кнопки</b> для быстрого доступа к функции!`,
    {
      parse_mode: "HTML",
      reply_markup: createMainKeyboard(),
    }
  );
});

// Команда /currency
bot.command("currency", async (ctx) => {
  console.log("✅ Команда /currency получена");
  try {
    await ctx.reply("🔄 Получаю актуальные курсы валют...");
    const data = await currencyService.getCurrencyDataFormatted();
    await ctx.reply(data || "Не удалось получить данные о валютах", {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    console.error("❌ Ошибка в команде /currency:", error);
    await ctx.reply("❌ Ошибка при получении данных о валютах", {
      reply_markup: createMainKeyboard(),
    });
  }
});

// Команда /crypto
bot.command("crypto", async (ctx) => {
  console.log("✅ Команда /crypto получена");
  try {
    await ctx.reply("🔄 Получаю данные о криптовалютах...");
    const data = await cryptoService.getCryptoDataFormatted();
    await ctx.reply(data || "Не удалось получить данных о криптовалютах", {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    console.error("❌ Ошибка в команде /crypto:", error);
    await ctx.reply("❌ Ошибка при получении данных о криптовалютах", {
      reply_markup: createMainKeyboard(),
    });
  }
});

// Команда /weather
bot.command("weather", async (ctx) => {
  console.log("✅ Команда /weather получена");
  try {
    await ctx.reply("🔄 Получаю данные о погоде...");
    const weather = await weatherService.getWeatherDataFormatted();
    await ctx.reply(weather, {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    console.error("❌ Ошибка в команде /weather:", error);
    await ctx.reply("❌ Ошибка при получении данных о погоде", {
      reply_markup: createMainKeyboard(),
    });
  }
});

// Команда /add
bot.command("add", async (ctx) => {
  console.log("✅ Команда /add получена:", ctx.message.text);
  const args = ctx.message.text.split(" ");

  if (args.length < 3) {
    await ctx.reply(
      "❌ <b>Неверный формат команды</b>\n\nФормат: <code>/add [ячейка] [текст]</code>\n\nПримеры:\n<code>/add A1 Привет мир</code>\n<code>/add B2 Данные для анализа</code>",
      {
        parse_mode: "HTML",
        reply_markup: createMainKeyboard(),
      }
    );
    return;
  }

  const cell = args[1].toUpperCase();
  const text = args.slice(2).join(" ");

  console.log(`📝 Пытаюсь записать в ячейку ${cell}: "${text}"`);

  try {
    await ctx.reply(`🔄 Записываю в ячейку ${cell}...`);
    const success = await writeToCell(cell, text);

    if (success) {
      await ctx.reply(`✅ Текст "${text}" успешно записан в ячейку ${cell}!`, {
        reply_markup: createMainKeyboard(),
      });
    } else {
      await ctx.reply(
        "❌ Ошибка! Не удалось записать в ячейку. Проверьте логи бота.",
        {
          reply_markup: createMainKeyboard(),
        }
      );
    }
  } catch (error) {
    console.error("💥 Критическая ошибка в /add:", error);
    await ctx.reply("💥 Произошла критическая ошибка при записи в таблицу", {
      reply_markup: createMainKeyboard(),
    });
  }
});

// Команда /clear
bot.command("clear", async (ctx) => {
  console.log("✅ Команда /clear получена");
  try {
    await userService.clearHistory(ctx.from.id);
    await ctx.reply("🗑️ История диалога очищена!", {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    console.error("❌ Ошибка в команде /clear:", error);
    await ctx.reply("❌ Ошибка при очистке истории", {
      reply_markup: createMainKeyboard(),
    });
  }
});

/* // Обработка текстовых сообщений от кнопок
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;

  // Проверяем авторизацию
  if (ctx.from.id !== parseInt(process.env.YOUR_USER_ID)) {
    console.log(
      "🔒 Попытка достра от неавторизованного пользователя:",
      ctx.from.id
    );
    return ctx.reply("🔒 Доступ ограничен");
  }

  // Если сообщение начинается с / - это команда, пропускаем
  if (text.startsWith("/")) return;

  console.log("📨 Текстовое сообщение от кнопки:", text);

  switch (text) {
    case "💰 Курсы валют":
      await ctx.reply("🔄 Получаю актуальные курсы валют...");
      const currencyData = await currencyService.getCurrencyDataFormatted();
      await ctx.reply(currencyData || "Не удалось получить данные о валютах", {
        reply_markup: createMainKeyboard(),
      });
      break;

    case "₿ Криптовалюты":
      await ctx.reply("🔄 Получаю данные о криптовалютах...");
      const cryptoData = await cryptoService.getCryptoDataFormatted();
      await ctx.reply(
        cryptoData || "Не удалось получить данные о криптовалютах",
        {
          reply_markup: createMainKeyboard(),
        }
      );
      break;

    case "🌤️ Погода":
      await ctx.reply("🔄 Получаю данные о погоде...");
      const weatherData = await weatherService.getWeatherDataFormatted();
      await ctx.reply(weatherData, {
        reply_markup: createMainKeyboard(),
      });
      break;

    case "📊 Google Таблица":
      await ctx.reply(
        "📊 <b>Работа с Google Таблицей</b>\n\nДля записи данных используйте команду:\n<code>/add A1 Ваш текст</code>\n\nПримеры:\n<code>/add A1 Привет мир</code>\n<code>/add B2 Данные для анализа</code>",
        {
          parse_mode: "HTML",
          reply_markup: createMainKeyboard(),
        }
      );
      break;

    case "🧹 Очистить историю":
      await userService.clearHistory(ctx.from.id);
      await ctx.reply("🗑️ История диалога очищена!", {
        reply_markup: createMainKeyboard(),
      });
      break;

    case "ℹ️ Помощь":
      await ctx.reply(
        `🎯 <b>Доступные команды:</b>\n\n/currency - Курсы валют ЦБ РФ\n/crypto - Топ-10 криптовалют\n/weather - Прогноз погоды\n/add - Запись в таблицу\n/clear - Очистить историю\n/help - Справка\n\n💡 <b>Или используйте кнопки</b> для быстрого доступа!`,
        {
          parse_mode: "HTML",
          reply_markup: createMainKeyboard(),
        }
      );
      break;

    default:
      // Если это не кнопка, обрабатываем как обычное сообщение
      await processTextMessage(ctx, text);
      break;
  }
}); */

// Функция обработки текстовых сообщений
async function processTextMessage(ctx, text) {
  const userId = ctx.from.id;
  console.log("🔧 Обработка текстового сообщения:", text);

  try {
    // Показываем статус "печатает"
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    const preciseData = await externalDataService.getPreciseData(text);

    if (preciseData) {
      console.log("📊 Найдены точные данные для ответа");
      await ctx.reply(preciseData, {
        reply_markup: createMainKeyboard(),
      });
      await userService.addToHistory(userId, text, "user");
      await userService.addToHistory(userId, preciseData, "assistant");
      return;
    }

    console.log("🤖 Передаю запрос нейросети GigaChat");
    await userService.addToHistory(userId, text, "user");
    const history = await userService.getChatHistory(userId);
    const messages = [getSystemPrompt(), ...history];

    const aiResponse = await askGigaChat(messages);
    await userService.addToHistory(userId, aiResponse, "assistant");
    await ctx.reply(aiResponse, {
      reply_markup: createMainKeyboard(),
    });
  } catch (error) {
    console.error("❌ Ошибка обработки:", error);
    await ctx.reply("❌ Произошла ошибка при обработке запроса", {
      reply_markup: createMainKeyboard(),
    });
  }
}

// Обработчик ошибок бота
bot.catch((error) => {
  console.error("❌ Ошибка в обработчике бота:", error);
});

// Обработчик вебхуков для Grammy
app.use("/webhook", async (req, res, next) => {
  try {
    console.log("📨 Получен вебхук от Telegram");
    // Преобразуем запрос Express в формат, понятный для grammY
    await bot.handleUpdate(req.body, res);
  } catch (error) {
    console.error("Error in webhook handler:", error);
    res.status(500).send("Error");
  }
});

async function initializeBot() {
  try {
    console.log("🔄 Инициализация бота...");

    // Сначала инициализируем базу данных
    await initDatabase();
    await userService.init();
    console.log("✅ База данных готова");

    // Инициализируем самого бота
    await bot.init();
    console.log("✅ Бот инициализирован");

    // Устанавливаем список команд для меню
    await bot.api.setMyCommands([
      { command: "currency", description: "Курсы валют ЦБ РФ" },
      { command: "crypto", description: "Топ-10 криптовалют" },
      { command: "weather", description: "Прогноз погоды" },
      { command: "add", description: "Запись в Google Таблицу" },
      { command: "clear", description: "Очистить историю диалога" },
      { command: "help", description: "Справка по командам" },
    ]);

    console.log("✅ Список команд установлен");

    // Режим работы
    if (process.env.NODE_ENV === "production") {
      // РЕЖИМ ДЛЯ СЕРВЕРА (ВЕБХУКИ)
      console.log("🌐 Используется режим Webhook для продакшена");

      if (!process.env.RENDER_EXTERNAL_URL) {
        throw new Error("RENDER_EXTERNAL_URL environment variable is not set!");
      }

      const webhookUrl = process.env.RENDER_EXTERNAL_URL + "/webhook";
      console.log(`🔄 Устанавливаем вебхук на: ${webhookUrl}`);

      await bot.api.setWebhook(webhookUrl);
      console.log("✅ Вебхук установлен");
    } else {
      // РЕЖИМ ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ (ЛОНГ-ПОЛЛИНГ)
      console.log("🤖 Используется Long Polling для локальной разработки");
      bot.start();
      console.log("✅ Бот успешно запущен в режиме polling");
    }

    return true;
  } catch (error) {
    console.error("💥 Критическая ошибка при инициализации бота:", error);
    throw error;
  }
}

// Главная функция запуска
async function startServer() {
  try {
    // Сначала инициализируем бота
    await initializeBot();

    // Затем запускаем сервер
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log("✅ Бот успешно инициализирован и готов к работе");
    });

    // Добавьте после запуска сервера
    app.get("/health", (req, res) => {
      res.json({ status: "ok", timestamp: new Date().toISOString() });
    });

    // Запустите пинг-сервис
    pingServer();

    // Обработчики завершения процесса
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

    return server;
  } catch (error) {
    console.error("💥 Не удалось запустить сервер:", error);
    process.exit(1);
  }
}

// Запускаем приложение
if (require.main === module) {
  startServer();
}

module.exports = { app, bot };
