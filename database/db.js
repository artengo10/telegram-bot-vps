const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const dbPath = path.join(__dirname, "Bot.db");
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

function initDatabase() {
  if (dbInstance) return dbInstance;

  try {
    console.log("🔍 Попытка подключения к базе данных...");
    console.log("🔍 Путь к базе данных:", dbPath);

    // Создаем новое подключение к базе данных
    const db = new Database(dbPath);
    console.log("✅ Подключение к SQLite базе данных установлено");

    // Создаем таблицы
    db.exec(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id INTEGER PRIMARY KEY,
        name TEXT,
        age INTEGER,
        interests TEXT,
        profession TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ База данных инициализирована");
    dbInstance = db;
    return db;
  } catch (error) {
    console.error("❌ Ошибка инициализации БД:", error);
    console.error("❌ Stack trace:", error.stack);
    throw error;
  }
}

function getDatabase() {
  if (!dbInstance) {
    throw new Error("База данных не инициализирована");
  }
  return dbInstance;
}

module.exports = { initDatabase, getDatabase };
