const { Bot, Keyboard } = require("grammy");
const fetch = require("node-fetch");
// Правильные импорты
const speechService = require("./services/speechService");
const { initDatabase } = require("./database/db");
const { userService, getSystemPrompt } = require("./services/userProfile");
const { askGigaChat } = require("./services/gigaChat");
const currencyService = require("./services/currencyService");
const cryptoService = require("./services/cryptoService");
const weatherService = require("./services/weatherService");
const externalDataService = require("./services/externalData");
const { writeToCell } = require("./services/googleSheets");
const {
  handleVoiceMessage,
  handleSpecificQuestions, 
} = require("./handlers/MessageHandlers");

// Загрузка переменных окружения
require("dotenv").config();

// Обработчики непойманных ошибок
process.on("uncaughtException", (error) => {
  console.error("💥 UNCAUGHT EXCEPTION:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 UNHANDLED REJECTION at:", promise, "reason:", reason);
  process.exit(1);
});

// ДЛЯ ОТЛАДКИ: проверим какой токен actually используется
console.log(
  "🔍 DEBUG: Current BOT_TOKEN from process.env:",
  process.env.BOT_TOKEN ? "SET" : "NOT SET"
);
console.log(
  "🔍 DEBUG: Token starts with:",
  process.env.BOT_TOKEN
    ? process.env.BOT_TOKEN.substring(0, 10) + "..."
    : "NULL"
);

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
  // ЗАЩИТА ОТ ЗАЦИКЛИВАНИЯ: проверяем, не обрабатывали ли мы уже это сообщение
  if (ctx.me && ctx.from.id === ctx.me.id) {
    console.log(
      "🛑 Защита от зацикливания: игнорируем сообщение от самого себя"
    );
    return;
  }

  console.log("✅ Команда /start получена от пользователя:", ctx.from.id);

  const welcomeText = `🤖 <b>Добро пожаловать!</b> Я ваш AI-ассистент с расширенными функцииями.

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

// Обработка текстовых сообщений от кнопок
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  const chatId = ctx.chat.id;
  const messageId = ctx.message.message_id;

  // ДОБАВИМ ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ
  console.log("📨 INCOMING MESSAGE:", {
    text: text,
    chatId: chatId,
    messageId: messageId,
    from: ctx.from,
    date: new Date(ctx.message.date * 1000).toISOString(),
  });

  // Проверяем, не от бота ли сообщение (чтобы избежать цикла)

  if (ctx.from.is_bot) {
    console.log("🛑 Сообщение от другого бота, игнорируем");
    return;
  }

  // Проверяем авторизацию
  if (ctx.from.id !== parseInt(process.env.YOUR_USER_ID)) {
    console.log(
      "🔒 Попытка доступа от неавторизованного пользователя:",
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
});

// Функция обработки текстовых сообщений

async function processTextMessage(ctx, text) {
  const userId = ctx.from.id;
  console.log("🔧 Обработка текстового сообщения:", text);

  try {
    // Показываем статус "печатает"
    await ctx.api.sendChatAction(ctx.chat.id, "typing");

    // Проверяем специфические вопросы
    const specificAnswer = handleSpecificQuestions(text);
    if (specificAnswer) {
      await ctx.reply(specificAnswer, {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    const preciseData = await externalDataService.getPreciseData(text);

    if (preciseData) {
      console.log("📊 Найдены точные данные для ответа");
      await ctx.reply(preciseData, {
        reply_markup: createMainKeyboard(),
      });
      return;
    }

    console.log("🤖 Передаю запрос нейросети GigaChat");
    const history = [];
    const userProfile = null; // Поскольку БД отключена
    const systemPrompt = getSystemPrompt(userProfile);

    // Явно добавляем текущее сообщение пользователя
    const messages = [
      systemPrompt,
      ...history,
      { role: "user", content: text },
    ];

    console.log(
      "📤 Отправляемые сообщения к GigaChat:",
      JSON.stringify(messages, null, 2)
    );

    const aiResponse = await askGigaChat(messages);
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

// Обработчик голосовых сообщений (используем функцию из MessageHandlers)
bot.on("message:voice", handleVoiceMessage);

// Главная функция запуска
async function startBot() {
  try {
    console.log("🔄 Инициализация бота...");
    console.log("🔍 Шаг 1: Инициализация базы данных");

    // ВРЕМЕННО ОТКЛЮЧАЕМ БАЗУ ДАННЫХ ДЛЯ ТЕСТА
    console.log("⏸️  База данных временно отключена для теста");
    // await initDatabase();
    // console.log("🔍 Шаг 2: Инициализация userService");
    // await userService.init();
    console.log("✅ База данных пропущена");

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

    // РЕЖИМ ДЛЯ Docker: LONG POLLING
    console.log("🔄 Запускаю бота в режиме Long Polling...");
    console.log("🔍 Шаг 5: Запуск bot.start()");

    await bot.start({
      onStart: ({ username }) => {
        console.log(`✅ Бот @${username} запущен и готов к работе!`);
      },
    });

    console.log(
      "🔍 Шаг 6: После bot.start() - эта строка не должна быть видна при успешном запуске"
    );
  } catch (error) {
    console.error("💥 Критическая ошибка при запуске бота:", error);
    console.error("💥 Stack trace:", error.stack);
    process.exit(1);
  }
}

// Запускаем бота
if (require.main === module) {
  startBot();
}

// Для других файлов, если нужно
module.exports = { bot };
