require("dotenv").config();
const { Bot } = require("grammy");

// Импорты обработчиков
const { setupCommandHandlers } = require("./handlers/commandHandler");
const { setupButtonHandlers } = require("./handlers/buttonHandler");
const { setupTextHandlers } = require("./handlers/textHandler");
const { initDatabase } = require("./database/db");
const { userService } = require("./services/userProfile");

// ДЛЯ ОТЛАДКИ
console.log("🔍 DEBUG: BOT_TOKEN:", process.env.BOT_TOKEN ? "SET" : "NOT SET");

async function startBot() {
  try {
    console.log("🔄 Инициализация бота...");

    // Инициализация БД
    await initDatabase();
    await userService.init();
    console.log("✅ База данных готова");

    // Создаем бота
    const bot = new Bot(process.env.BOT_TOKEN);

    // Настройка обработчиков
    setupCommandHandlers(bot);
    setupButtonHandlers(bot);
    setupTextHandlers(bot);

    // Устанавливаем команды меню
    await bot.api.setMyCommands([
      { command: "currency", description: "Курсы валют ЦБ РФ" },
      { command: "crypto", description: "Топ-10 криптовалют" },
      { command: "weather", description: "Прогноз погоды" },
      { command: "add", description: "Запись в Google Таблицу" },
      { command: "clear", description: "Очистить историю диалога" },
      { command: "help", description: "Справка по командам" },
    ]);

    console.log("✅ Список команд установлен");

    // Очищаем очередь сообщений
    console.log("🧹 Очищаю очередь старых сообщений...");
    await bot.api.deleteWebhook({ drop_pending_updates: true });

    // Запускаем long polling
    console.log("🔄 Запускаю бота в режиме Long Polling...");
    bot.start();

    console.log("✅ Бот запущен и готов к работе!");
  } catch (error) {
    console.error("💥 Критическая ошибка при запуске бота:", error);
    process.exit(1);
  }
}

// Запускаем бота
if (require.main === module) {
  startBot();
}

module.exports = { bot: new Bot(process.env.BOT_TOKEN) };
