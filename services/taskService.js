const { writeToRange, writeToCell } = require("./googleSheets");

class TaskService {
  constructor() {
    this.sheetsConfig = {
      todoSheet: "ToDoList",
      habitsSheet: "HabitsTracker",
      todoRange: "A2:D100",
      habitsRange: "A2:E100",
    };
  }

  async addTodo(task, priority = "medium") {
    const timestamp = new Date().toISOString();
    const row = [timestamp, task, priority, "active"];

    // Найдем первую свободную строку в столбце A
    for (let i = 2; i <= 100; i++) {
      const cellValue = await this.getCellValue(`A${i}`);
      if (!cellValue) {
        return await writeToRange(`A${i}:D${i}`, [row]);
      }
    }
    return false;
  }

  async completeTodo(taskId) {
    return await writeToCell(`D${taskId + 1}`, "completed");
  }

  async addHabit(habitName, frequency = "daily") {
    const timestamp = new Date().toISOString();
    const today = new Date().toDateString();
    const row = [timestamp, habitName, frequency, today, "0/30"]; // 0 из 30 дней

    for (let i = 2; i <= 100; i++) {
      const cellValue = await this.getCellValue(`A${i}`);
      if (!cellValue) {
        return await writeToRange(`A${i}:E${i}`, [row]);
      }
    }
    return false;
  }

  async markHabit(habitId) {
    // Обновим статистику привычки
    const currentCell = `E${habitId + 1}`;
    const currentValue = await this.getCellValue(currentCell);
    if (currentValue) {
      const [current, total] = currentValue.split("/").map(Number);
      const newValue = `${current + 1}/${total}`;
      return await writeToCell(currentCell, newValue);
    }
    return false;
  }

  // Вспомогательная функция для чтения ячеек (нужно добавить в googleSheets.js)
  async getCellValue(cell) {
    // Эта функция потребует добавления метода readFromCell в googleSheets.js
    // Временно возвращаем null
    return null;
  }
}

module.exports = new TaskService();
