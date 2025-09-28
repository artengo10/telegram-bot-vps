const { askGigaChat } = require("./gigaChat");

class TextProcessingService {
  async correctText(text) {
    const prompt = `Исправь орфографические и грамматические ошибки в следующем тексте. Ответь ТОЛЬКО исправленным текстом без дополнительных комментариев:\n\n${text}`;

    return await askGigaChat([{ role: "user", content: prompt }]);
  }

  async summarizeText(text) {
    const prompt = `Сделай краткое содержание следующего текста (3-5 предложений). Ответь ТОЛЬКО кратким содержанием:\n\n${text}`;

    return await askGigaChat([{ role: "user", content: prompt }]);
  }
}

module.exports = new TextProcessingService();
