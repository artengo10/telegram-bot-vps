const { userService } = require("../services/userProfile");
const { askGigaChat } = require("../services/gigaChat");
const { getSystemPrompt } = require("../services/userProfile");
const externalDataService = require("../services/externalData");
const { createMainKeyboard } = require("../utils/helpers");

function setupTextHandlers(bot) {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text;

    // Если это команда или кнопка - пропускаем
    if (text.startsWith("/") || isButtonText(text)) {
      return;
    }

    // Обработка обычного текста
    await processTextMessage(ctx, text);
  });
}

async function processTextMessage(ctx, text) {
  // Ваша существующая логика из messageHandler.js
}

function isButtonText(text) {
  const buttonTexts = [
    "💰 Курсы валют",
    "₿ Криптовалюты",
    "🌤️ Погода",
    "📊 Google Таблица",
    "🧹 Очистить историю",
    "ℹ️ Помощь",
  ];
  return buttonTexts.includes(text);
}

module.exports = { setupTextHandlers, processTextMessage };
