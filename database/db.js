const { Database } = require("sqlite");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const fs = require("fs");

// Убедимся, что директория существует
const dbPath = path.join(__dirname, "bot.db");
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbInstance = null;

async function initDatabase() {
  if (dbInstance) return dbInstance;

  try {
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await db.exec(`
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
