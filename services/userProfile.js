const { getDatabase } = require("../database/db");

class UserProfileService {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = getDatabase();
  }

  // Сохраняем сообщение в базу данных
  async addToHistory(userId, message, role = "user") {
    await this.db.run(
      "INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)",
      [userId, role, message]
    );
  }

  // Получаем историю диалога из базы
  async getChatHistory(userId, limit = 10) {
    const messages = await this.db.all(
      `
            SELECT role, content 
            FROM chat_history 
            WHERE user_id = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `,
      [userId, limit]
    );

    return messages.reverse();
  }

  // Очищаем историю
  async clearHistory(userId) {
    await this.db.run("DELETE FROM chat_history WHERE user_id = ?", [userId]);
  }

  // Сохраняем профиль пользователя
  async saveProfile(userId, profile) {
    await this.db.run(
      `
            INSERT OR REPLACE INTO user_profiles (user_id, name, age, interests, profession)
            VALUES (?, ?, ?, ?, ?)
        `,
      [userId, profile.name, profile.age, profile.interests, profile.profession]
    );
  }

  // Получаем профиль пользователя
  async getProfile(userId) {
    return await this.db.get("SELECT * FROM user_profiles WHERE user_id = ?", [
      userId,
    ]);
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
    content: `Ты - ассистент ${profileInfo}. Твоя задача - помогать с анализом и принятием решений.

# Стиль общения
- Отвечай кратко и по делу
- Избегай излишней формальности
- Можно использовать смайлики для дружелюбного тона
- Фокусируйся на сути, без лишних вступлений

# Формат ответов
Для простых запросов (приветствия, быстрые вопросы) отвечай кратко и дружелюбно.

Для сложных запросов используй аналитический подход, но сократи формат:
1. Определи тип запроса
2. Кратко проанализируй ключевые аспекты
3. Дай сбалансированную рекомендацию

Избегай шаблонных фраз вроде "адаптированный анализ" - просто давай суть.`,
  };
}

module.exports = { userService, getSystemPrompt };
