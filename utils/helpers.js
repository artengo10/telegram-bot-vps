const { Keyboard } = require("grammy");

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
    .persistent();
}

module.exports = { createMainKeyboard };
