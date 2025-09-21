require("dotenv").config(); 

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  YOUR_USER_ID: parseInt(process.env.YOUR_USER_ID),
  AUTH_KEY: process.env.AUTH_KEY,
  GIGACHAT_API_KEY: process.env.GIGACHAT_API_KEY, // Добавьте эту строку
};
