const currencyService = require("./currencyService");
const cryptoService = require("./cryptoService");
const weatherService = require("./weatherService");

class ExternalDataService {
  async getPreciseData(query) {
    const lowerQuery = query.toLowerCase();

    // Определяем конкретную валюту
    const currencyMatch = currencyService.matchCurrency(lowerQuery);
    if (currencyMatch) {
      const currency = await currencyService.getSpecificCurrency(currencyMatch);
      if (currency) {
        return currencyService.formatCurrencyResponse(currency, true);
      }
    }

    // Определяем конкретную криптовалюту
    const cryptoMatch = cryptoService.matchCrypto(lowerQuery);
    if (cryptoMatch) {
      const crypto = await cryptoService.getSpecificCrypto(cryptoMatch);
      if (crypto) {
        return cryptoService.formatCryptoResponse(crypto, cryptoMatch, true);
      }
    }

    // Общие запросы
    if (lowerQuery.includes("погод") || lowerQuery.includes("weather")) {
      const city = weatherService.extractCity(query) || "Нижний Новгород";
      return await weatherService.getWeatherDataFormatted(city);
    }

    if (
      lowerQuery.includes("валют") ||
      lowerQuery.includes("курс") ||
      lowerQuery.includes("currency") ||
      lowerQuery.includes("exchange")
    ) {
      return await currencyService.getCurrencyDataFormatted();
    }

    if (lowerQuery.includes("крипт") || lowerQuery.includes("crypto")) {
      return await cryptoService.getCryptoDataFormatted();
    }

    return null;
  }
}

module.exports = new ExternalDataService();
