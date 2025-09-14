const { askGigaChat } = require("../services/gigaChat");
const {
  getChatHistory,
  addToHistory,
  clearHistory,
} = require("../services/userProfile");
const { YOUR_USER_ID } = require("../config/keys");

async function handleMessage(ctx) {
  if (ctx.from.id !== YOUR_USER_ID) {
    return ctx.reply("Извините, этот бот приватный");
  }

  const userMessage = ctx.message.text;
  const userId = ctx.from.id;

  console.log("Сообщение от пользователя:", userMessage);

  // Показываем статус "печатает"
  await ctx.api.sendChatAction(ctx.chat.id, "typing");

  // Добавляем сообщение в историю
  addToHistory(userId, userMessage, "user");

  // Получаем историю диалога
  const messages = getChatHistory(userId);

  // Отправляем запрос к GigaChat
  const aiResponse = await askGigaChat(messages);

  // Добавляем ответ в историю
  addToHistory(userId, aiResponse, "assistant");

  // Отправляем ответ пользователю
  await ctx.reply(aiResponse);
}

async function handleClearCommand(ctx) {
  if (ctx.from.id !== YOUR_USER_ID) return;

  clearHistory(ctx.from.id);
  await ctx.reply("🗑️ История диалога очищена!");
}

async function handleInfoCommand(ctx) {
  if (ctx.from.id !== YOUR_USER_ID) return;

  const history = getChatHistory(ctx.from.id);
  const messageCount = history.length - 1; // minus system prompt

  await ctx.reply(
    `📊 Информация о диалоге:\n` +
      `Сообщений в истории: ${messageCount}\n` +
      `Используйте /clear чтобы очистить историю`
  );
}

module.exports = { handleMessage, handleClearCommand, handleInfoCommand };
