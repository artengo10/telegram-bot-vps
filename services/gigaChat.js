const https = require("https");
const { AUTH_KEY } = require("../config/keys");

const customAgent = new https.Agent({ rejectUnauthorized: false });

// Кэш для токена и его времени жизни
let accessTokenCache = {
  token: null,
  expiresAt: 0,
};

async function getGigaChatToken() {
  // Если токен еще действителен, возвращаем его
  if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
    console.log("Используем кэшированный токен");
    return accessTokenCache.token;
  }

  try {
   const fetch = require("node-fetch");

    const response = await fetch(
      "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${AUTH_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
          RqUID: generateUUID(),
        },
        body: "scope=GIGACHAT_API_PERS",
        agent: customAgent,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Сохраняем токен в кэш (предполагаем, что он действителен 30 минут)
    accessTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 минут
    };

    console.log("Новый токен получен");
    return data.access_token;
  } catch (error) {
    console.error("Ошибка получения токена:", error.message);
    return null;
  }
}

async function askGigaChat(messages, maxTokens = 512) {
  try {
    const accessToken = await getGigaChatToken();
    if (!accessToken) return "Ошибка подключения к AI";

    const { default: fetch } = await import("node-fetch");

    const response = await fetch(
      "https://gigachat.devices.sberbank.ru/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: "GigaChat",
          messages: messages,
          temperature: 0.7,
          max_tokens: maxTokens,
        }),
        agent: customAgent,
      }
    );

    if (!response.ok) {
      throw new Error(`GigaChat error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Ошибка запроса к GigaChat:", error.message);
    return "Извините, произошла ошибка";
  }
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = { getGigaChatToken, askGigaChat };
