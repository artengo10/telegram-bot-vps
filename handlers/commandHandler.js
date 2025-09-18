const { userService } = require("../services/userProfile");
const currencyService = require("../services/currencyService");
const cryptoService = require("../services/cryptoService");
const weatherService = require("../services/weatherService");
const { writeToCell } = require("../services/googleSheets");
const { createMainKeyboard } = require("../utils/helpers");

function setupCommandHandlers(bot) {
  // Команда /start
  bot.command("start", async (ctx) => {
    const welcomeText = `🤖 <b>Добро пожаловать!</b> Я ваш AI-ассистент...`;
    await ctx.reply(welcomeText, {
      parse_mode: "HTML",
      reply_markup: createMainKeyboard(),
    });
  });

  // Команда /help
  bot.command("help", async (ctx) => {
    await ctx.reply(`🎯 <b>Доступные команды:</b>...`, {
      parse_mode: "HTML",
      reply_markup: createMainKeyboard(),
    });
  });

  // Команда /currency
  bot.command("currency", async (ctx) => {
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

  // Остальные команды аналогично...
}

module.exports = { setupCommandHandlers };
