const { google } = require("googleapis");

// Настройки доступа
const auth = new google.auth.GoogleAuth({
  keyFile: "credentials.json", // Путь к файлу с ключами (должен быть в корне проекта)
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

// ID вашей таблицы
const spreadsheetId = "1RIDsDwPAJkqWiyrJc9qZxcLpJmbFw2WvEbPIypw8eKo";

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
 * Записывает значение в конкретную ячейку
 * @param {string} cell - Ячейка для записи (например: "A1", "B2", "C5")
 * @param {string} value - Значение для записи
 * @returns {Promise<boolean>} - Успешно ли прошла запись
 */
async function writeToCell(cell, value) {
  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: cell, // Например: "B1"
      valueInputOption: "USER_ENTERED",
      resource: {
        values: [[value]], // Двойной массив для одной ячейки
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
