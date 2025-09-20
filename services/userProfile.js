const { getDatabase } = require("../database/db");

class UserProfileService {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = getDatabase();
    if (!this.db) {
      throw new Error("База данных не инициализирована");
    }
  }

  // Сохраняем сообщение в базу данных
  async addToHistory(userId, content, role) {
    try {
      const stmt = this.db.prepare(
        "INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)"
      );
      stmt.run(userId, role, content);
    } catch (error) {
      console.error("❌ Ошибка записи в историю:", error);
    }
  }

  // Получаем историю диалога из базы
  async getChatHistory(userId, limit = 10) {
    try {
      const stmt = this.db.prepare(`
        SELECT role, content 
        FROM chat_history 
        WHERE user_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      const messages = stmt.all(userId, limit);
      return messages.reverse();
    } catch (error) {
      console.error("❌ Ошибка чтения истории:", error);
      return [];
    }
  }

  // Очищаем историю
  async clearHistory(userId) {
    try {
      const stmt = this.db.prepare(
        "DELETE FROM chat_history WHERE user_id = ?"
      );
      stmt.run(userId);
    } catch (error) {
      console.error("❌ Ошибка очистки истории:", error);
    }
  }

  // Сохраняем профиль пользователя
  async saveProfile(userId, profile) {
    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO user_profiles (user_id, name, age, interests, profession)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(
        userId,
        profile.name,
        profile.age,
        profile.interests,
        profile.profession
      );
    } catch (error) {
      console.error("❌ Ошибка сохранения профиля:", error);
    }
  }

  // Получаем профиль пользователя
  async getProfile(userId) {
    try {
      const stmt = this.db.prepare(
        "SELECT * FROM user_profiles WHERE user_id = ?"
      );
      return stmt.get(userId);
    } catch (error) {
      console.error("❌ Ошибка получения профиля:", error);
      return null;
    }
  }
}

// Создаем экземпляр сервиса
const userService = new UserProfileService();

// Оптимизированный системный промпт
function getSystemPrompt(userProfile = null) {
  let profileInfo =
    "Артем, 17 лет, бизнес (продажа рекламы), IT, планы по вендингу.";

  if (userProfile) {
    profileInfo = `${userProfile.name || "Артем"}, ${
      userProfile.age || "17"
    } лет, `;
    if (userProfile.profession)
      profileInfo += `бизнес (${userProfile.profession}), `;
    if (userProfile.interests)
      profileInfo += `интересы: ${userProfile.interests}`;
  }

  return {
    role: "system",
    content: `Ты - универсальный ассистент ${profileInfo}. Твоя задача - помогать с любыми вопросами.

# Стиль общения
- Отвечай по существу заданного вопроса
- Будь дружелюбным, но не слишком формальным
- Можно использовать смайлики для дружелюбного тона
- Адаптируй стиль ответа под тип вопроса

# Принципы ответов
1. На простые вопросы (приветствия, быстрые вопросы) отвечай кратко и дружелюбно
2. На конкретные вопросы (про сказки, факты, знания) давай прямой ответ по теме
3. На бизнес-вопросы используй аналитический подход
4. Если вопрос непонятен, уточни, что именно интересует

Примеры хороших ответов:
- На "Привет" → "Привет! 😊 Чем могу помочь?"
- На "Как дела?" → "Всё отлично! Готов помочь с любыми вопросами."
- На "Ты знаешь сказку о колобке?" → "Конечно знаю! Это народная сказка о колобке, который ушел от дедушки и бабушки и встретил разных животных в лесу. Хочешь, расскажу подробнее?"
- На бизнес-вопросы → давай аналитический ответ с рекомендациями

Отвечай на вопросы прямо и по существу, без лишних отвлечений на бизнес-тематику, если вопрос не связан с ней.`,
  };
}

module.exports = { userService, getSystemPrompt };
