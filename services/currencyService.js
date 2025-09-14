const axios = require("axios");

class CurrencyService {
  constructor() {
    this.currencyMap = {
      доллар: "USD",
      доллара: "USD",
      доллары: "USD",
      usd: "USD",
      бакс: "USD",
      бакса: "USD",
      евро: "EUR",
      eur: "EUR",
      юан: "CNY",
      yuan: "CNY",
      cny: "CNY",
      иен: "JPY",
      yen: "JPY",
      jpy: "JPY",
      фунт: "GBP",
      gbp: "GBP",
      франк: "CHF",
      chf: "CHF",
      лира: "TRY",
      try: "TRY",
      крона: "SEK",
      sek: "SEK",
      злот: "PLN",
      pln: "PLN",
      вона: "KRW",
      krw: "KRW",
    };
  }

  async getCurrencyRates() {
    try {
      const response = await axios.get(
        "https://www.cbr-xml-daily.ru/daily_json.js",
        {
          timeout: 5000,
        }
      );
      return response.data;
    } catch (error) {
      console.error("Ошибка получения курсов валют:", error.message);
      return null;
    }
  }

  matchCurrency(query) {
    for (const [key, currency] of Object.entries(this.currencyMap)) {
      if (query.includes(key)) {
        return currency;
      }
    }
    return null;
  }

  async getSpecificCurrency(currencyCode) {
    const data = await this.getCurrencyRates();
    if (!data || !data.Valute[currencyCode]) {
      return null;
    }

    const currency = data.Valute[currencyCode];
    const change = currency.Value - currency.Previous;

    return {
      name: currency.Name,
      value: currency.Value.toFixed(2),
      change: change.toFixed(2),
      nominal: currency.Nominal,
      code: currencyCode,
    };
  }

  async getAllCurrencies() {
    const data = await this.getCurrencyRates();
    if (!data) return null;

    const currencies = {};
    const topCurrencies = [
      "USD",
      "EUR",
      "CNY",
      "GBP",
      "JPY",
      "CHF",
      "TRY",
      "SEK",
      "PLN",
      "KRW",
    ];

    topCurrencies.forEach((code) => {
      if (data.Valute[code]) {
        const currency = data.Valute[code];
        currencies[code] = {
          name: currency.Name,
          value: currency.Value.toFixed(2),
          change: (currency.Value - currency.Previous).toFixed(2),
          nominal: currency.Nominal,
        };
      }
    });

    return currencies;
  }

  formatCurrencyResponse(currency, isSpecific = false) {
    const change = parseFloat(currency.change);
    const changeIcon = change > 0 ? "📈" : change < 0 ? "📉" : "➡️";
    const changeText =
      change !== 0 ? ` (${change > 0 ? "+" : ""}${change} ₽)` : "";

    if (isSpecific) {
      return `💱 ${currency.name}
            
Курс: ${currency.value} ₽ за ${currency.nominal} ${currency.code}
Изменение: ${changeIcon}${changeText}

📊 Источник: Центральный Банк РФ
🕐 ${new Date().toLocaleTimeString("ru-RU")}`;
    }

    return `${changeIcon} ${currency.name}: ${currency.value} ₽${changeText}`;
  }

  async getCurrencyDataFormatted() {
    const currencies = await this.getAllCurrencies();
    if (!currencies) return "Не удалось получить курсы валют";

    let result = `💱 Топ-10 валют (ЦБ РФ)\n\n`;

    Object.values(currencies).forEach((currency) => {
      result += this.formatCurrencyResponse(currency) + "\n";
    });

    result += `\n📊 Источник: Центральный Банк РФ\n`;
    result += `🕐 Обновлено: ${new Date().toLocaleTimeString("ru-RU")}`;

    return result;
  }
}

module.exports = new CurrencyService();
