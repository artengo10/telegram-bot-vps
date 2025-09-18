const currencyService = require("../services/currencyService");
const cryptoService = require("../services/cryptoService");
const weatherService = require("../services/weatherService");
const { userService } = require("../services/userProfile");
const { createMainKeyboard } = require("../utils/helpers");

function setupButtonHandlers(bot) {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;

    // Проверка авторизации
    if (ctx.from.id !== parseInt(process.env.YOUR_USER_ID)) {
      return ctx.reply("🔒 Доступ ограничен");
    }

    switch (text) {
      case "💰 Курсы валют":
        // Обработка кнопки валют
        break;
      case "₿ Криптовалюты":
        // Обработка кнопки крипты
        break;
      // ... остальные кнопки
      default:
        // Не кнопка - передаем текстовому обработчику
        return;
    }
  });
}

module.exports = { setupButtonHandlers };
