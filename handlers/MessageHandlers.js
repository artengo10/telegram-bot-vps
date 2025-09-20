const { askGigaChat } = require("../services/gigaChat");
const { userService, getSystemPrompt } = require("../services/userProfile");
const { YOUR_USER_ID } = require("../config/keys");
const speechService = require("../services/speechService");
const fetch = require("node-fetch");

// Функция для обработки специфических вопросов
function handleSpecificQuestions(text) {
  const lowerText = text.toLowerCase();

  if (
    lowerText.includes("как меня зовут") ||
    lowerText.includes("мое имя") ||
    lowerText.includes("меня зовут") ||
    lowerText.includes("кто я")
  ) {
    return "Тебя зовут Артем!";
  }

  if (
    lowerText.includes("сколько мне лет") ||
    lowerText.includes("мой возраст") ||
    lowerText.includes("мне лет")
  ) {
    return "Тебе 17 лет!";
  }

  if (
    lowerText.includes("чем я занимаюсь") ||
    lowerText.includes("моя работа") ||
    lowerText.includes("мой бизнес") ||
    lowerText.includes("что я делаю")
  ) {
    return "Ты занимаешься бизнесом (продажа рекламы), IT и планируешь развивать вендинговый бизнес!";
  }

  return null;
}

async function handleMessage(ctx) {
  if (ctx.from.id !== YOUR_USER_ID) {
    return ctx.reply("Извините, этот бот приватный");
  }

  const userMessage = ctx.message.text;
  const userId = ctx.from.id;

  console.log("Сообщение от пользователя:", userMessage);

  // Проверяем специфические вопросы
  const specificAnswer = handleSpecificQuestions(userMessage);
  if (specificAnswer) {
    await ctx.reply(specificAnswer);
    return;
  }

  // Показываем статус "печатает"
  await ctx.api.sendChatAction(ctx.chat.id, "typing");

  // Добавляем сообщение в историю (если БД включена)
  // await userService.addToHistory(userId, userMessage, "user");

  // Получаем историю диалога (если БД включена)
  // const messages = await userService.getChatHistory(userId);

  // ДОБАВЛЯЕМ ЛОГИРОВАНИЕ ИСТОРИИ ЗДЕСЬ
  // console.log("📋 История сообщений:", JSON.stringify(messages, null, 2));

  // Получаем профиль пользователя для персонализации
  // const userProfile = await userService.getProfile(userId);
  const userProfile = null; // Временно, пока БД отключена
  const systemPrompt = getSystemPrompt(userProfile);

  // Подготавливаем сообщения для GigaChat
  const messages = [systemPrompt, { role: "user", content: userMessage }];

  console.log(
    "📤 Отправляемые сообщения к GigaChat:",
    JSON.stringify(messages, null, 2)
  );

  // Отправляем запрос к GigaChat
  const aiResponse = await askGigaChat(messages);

  // Добавляем ответ в историю (если БД включена)
  // await userService.addToHistory(userId, aiResponse, "assistant");

  // Отправляем ответ пользователю
  await ctx.reply(aiResponse);
}

async function handleClearCommand(ctx) {
  if (ctx.from.id !== YOUR_USER_ID) return;

  // await userService.clearHistory(ctx.from.id); // Временно отключено
  await ctx.reply("🗑️ История диалога очищена!");
}

async function handleInfoCommand(ctx) {
  if (ctx.from.id !== YOUR_USER_ID) return;

  // const history = await userService.getChatHistory(ctx.from.id); // Временно отключено
  const history = [];
  const messageCount = history.length;

  await ctx.reply(
    `📊 Информация о диалоге:\n` +
      `Сообщений в истории: ${messageCount}\n` +
      `Используйте /clear чтобы очистить историю`
  );
}

async function handleVoiceMessage(ctx) {
  if (ctx.from.id !== YOUR_USER_ID) {
    return ctx.reply("Извините, этот бот приватный");
  }

  try {
    await ctx.replyWithChatAction("typing");

    // Скачиваем голосовое сообщение
    const fileId = ctx.message.voice.file_id;
    const file = await ctx.api.getFile(fileId);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

    // Загружаем аудио данные
    const response = await fetch(fileUrl);
    const audioBuffer = await response.buffer();

    // Преобразуем речь в текст
    const text = await speechService.speechToText(audioBuffer);

    if (!text) {
      return ctx.reply("Не удалось распознать речь");
    }

    // Проверяем специфические вопросы
    const specificAnswer = handleSpecificQuestions(text);
    if (specificAnswer) {
      await ctx.reply(specificAnswer);
      return;
    }

    // Отправляем распознанный текст пользователю
    await ctx.reply(`🗣️ Распознано: ${text}`);

    // Создаем сообщения для GigaChat с явным указанием контекста
    const messages = [
      getSystemPrompt(), // Системный промпт с информацией о пользователе
      { role: "user", content: text }, // Текущее сообщение пользователя
    ];

    console.log(
      "📤 Отправляемые сообщения к GigaChat:",
      JSON.stringify(messages, null, 2)
    );

    // Отправляем запрос к GigaChat
    await ctx.api.sendChatAction(ctx.chat.id, "typing");
    const aiResponse = await askGigaChat(messages);

    // Отправляем ответ пользователю
    await ctx.reply(aiResponse);
  } catch (error) {
    console.error("Voice processing error:", error);
    ctx.reply("Произошла ошибка при обработке голосового сообщения");
  }
}

module.exports = {
  handleMessage,
  handleClearCommand,
  handleInfoCommand,
  handleVoiceMessage,
  handleSpecificQuestions, // добавляем эту строку
};
