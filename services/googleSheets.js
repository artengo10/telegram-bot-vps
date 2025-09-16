const { google } = require("googleapis");

// Создаем объект учетных данных из переменных окружения
function getAuth() {
  try {
    // Формируем объект credentials из переменных окружения
    const credentials = {
      type: process.env.GOOGLE_TYPE,
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // Важно: заменяем \n на настоящие переносы строк
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_CLIENT_ID,
      auth_uri:
        process.env.GOOGLE_AUTH_URI ||
        "https://accounts.google.com/o/oauth2/auth",
      token_uri:
        process.env.GOOGLE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url:
        process.env.GOOGLE_AUTH_PROVIDER_CERT_URL ||
        "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
    };

    console.log(
      "[Google Sheets] Using environment variables for authentication"
    );

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    return auth;
  } catch (error) {
    console.error("[Google Sheets] Auth initialization error:", error);
    throw error;
  }
}

const auth = getAuth();
const sheets = google.sheets({ version: "v4", auth });

// ID вашей таблицы из переменной окружения
const spreadsheetId =
  process.env.GOOGLE_SHEET_ID || "1RIDsDwPAJkqWiyrJc9qZxcLpJmbFw2WvEbPIypw8eKo";

/**
 * Записывает значение в конкретную ячейку
 * @param {string} cell - Ячейка для записи (например: "A1", "B2", "C5")
 * @param {string} value - Значение для записи
 * @returns {Promise<boolean>} - Успешно ли прошла запись
 */
async function writeToCell(cell, value) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: cell,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[value]],
      },
    });
    console.log(`[Google Sheets] Данные добавлены в ячейку ${cell}:`, value);
    return true;
  } catch (error) {
    console.error("[Google Sheets] Ошибка:", error);
    return false;
  }
}

/**
 * Добавляет строку данных в конец столбца A
 * @param {Array} rowData - Массив данных для одной строки
 * @returns {Promise<boolean>} - Успешно ли прошла запись
 */
async function addRow(rowData) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "A:A", // Записываем в первый столбец
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [rowData],
      },
    });
    console.log("[Google Sheets] Данные добавлены в столбец A:", rowData);
    return true;
  } catch (error) {
    console.error("[Google Sheets] Ошибка:", error);
    return false;
  }
}

/**
 * Записывает данные в указанный диапазон
 * @param {string} range - Диапазон для записи (например: "A1:B2")
 * @param {Array} data - Данные для записи
 * @returns {Promise<boolean>} - Успешно ли прошла запись
 */
async function writeToRange(range, data) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: range,
      valueInputOption: "USER_ENTERED",
      resource: {
        values: data,
      },
    });
    console.log(`[Google Sheets] Данные добавлены в диапазон ${range}:`, data);
    return true;
  } catch (error) {
    console.error("[Google Sheets] Ошибка:", error);
    return false;
  }
}

module.exports = {
  addRow,
  writeToCell,
  writeToRange,
};
