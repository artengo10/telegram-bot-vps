const axios = require("axios");

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY; 
  }

  async getWeather(city = "Нижний Новгород") {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKey}&units=metric&lang=ru`,
        { timeout: 5000 }
      );

      const data = response.data;
      return {
        city: data.name,
        temp: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        description: data.weather[0].description,
        wind: Math.round(data.wind.speed),
        pressure: Math.round(data.main.pressure * 0.75),
      };
    } catch (error) {
      console.error("Ошибка получения погоды:", error.message);
      return null;
    }
  }

  extractCity(query) {
    const cities = [
      "Нижнем Новгороде",
      "санкт-петербург",
      "новосибирск",
      "екатеринбург",
      "казань",
      "челябинск",
      "самара",
      "омск",
      "ростов",
      "сочи",
      "краснодар",
      "владивосток",
    ];
    for (const city of cities) {
      if (query.toLowerCase().includes(city)) {
        return city;
      }
    }
    return null;
  }

  async getWeatherDataFormatted(city) {
    const weather = await this.getWeather(city);
    if (!weather) return "Не удалось получить данные о погоде";

    return `🌡️ Погода в ${weather.city}:
• Температура: ${weather.temp}°C (ощущается как ${weather.feels_like}°C)
• ${weather.description}
• Влажность: ${weather.humidity}%
• Ветер: ${weather.wind} м/с
• Давление: ${weather.pressure} мм рт.ст.

Источник: OpenWeatherMap`;
  }
}

module.exports = new WeatherService();
