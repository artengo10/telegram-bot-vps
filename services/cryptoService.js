const axios = require("axios");

class CryptoService {
  constructor() {
    this.apiUrl = "https://api.coincap.io/v2"; // Новое стабильное API
    this.cryptoMap = {
      биткоин: "bitcoin",
      bitcoin: "bitcoin",
      btc: "bitcoin",
      эфир: "ethereum",
      ethereum: "ethereum",
      eth: "ethereum",
      usdt: "tether",
      тетер: "tether",
      tether: "tether",
      bnb: "binance-coin",
      solana: "solana",
      sol: "solana",
      cardano: "cardano",
      ada: "cardano",
      ripple: "ripple",
      xrp: "ripple",
      доги: "dogecoin",
      dogecoin: "dogecoin",
      doge: "dogecoin",
      polkadot: "polkadot",
      dot: "polkadot",
      litecoin: "litecoin",
      ltc: "litecoin",
    };
  }

  // ОСНОВНОЙ МЕТОД ДЛЯ ПОЛУЧЕНИЯ ТОП-10
  async getCryptoRates() {
    try {
      console.log("🔄 Запрос к CoinCap API...");
      const response = await axios.get(`${this.apiUrl}/assets?limit=10`, {
        timeout: 8000,
      });
      const cryptoData = response.data.data;

      const rates = {};
      cryptoData.forEach((coin, index) => {
        rates[coin.symbol] = {
          name: coin.name,
          usd: parseFloat(coin.priceUsd).toLocaleString("ru-RU", {
            maximumFractionDigits: 2,
          }),
          change: parseFloat(coin.changePercent24Hr).toFixed(2),
          market_cap: this.formatMarketCap(parseFloat(coin.marketCapUsd)),
          rank: index + 1,
          id: coin.id, // Добавляем ID для поиска конкретной монеты
        };
      });

      return rates;
    } catch (error) {
      console.error("Ошибка получения курсов крипты:", error.message);
      return null;
    }
  }

  formatMarketCap(marketCap) {
    if (marketCap >= 1e12) return (marketCap / 1e12).toFixed(2) + " трлн";
    if (marketCap >= 1e9) return (marketCap / 1e9).toFixed(2) + " млрд";
    if (marketCap >= 1e6) return (marketCap / 1e6).toFixed(2) + " млн";
    return marketCap.toLocaleString();
  }

  matchCrypto(query) {
    return this.cryptoMap[query.toLowerCase()];
  }

  async getSpecificCrypto(cryptoId) {
    try {
      // Используем ID монеты для поиска (например "bitcoin")
      const response = await axios.get(`${this.apiUrl}/assets/${cryptoId}`, {
        timeout: 5000,
      });
      const coin = response.data.data;

      return {
        name: coin.name,
        usd: parseFloat(coin.priceUsd).toLocaleString("ru-RU", {
          maximumFractionDigits: 2,
        }),
        change: parseFloat(coin.changePercent24Hr).toFixed(2),
        market_cap: this.formatMarketCap(parseFloat(coin.marketCapUsd)),
        rank: parseInt(coin.rank),
        symbol: coin.symbol,
      };
    } catch (error) {
      console.error("Ошибка при поиске конкретной крипты:", error.message);
      return null;
    }
  }

  async getAllCrypto() {
    return await this.getCryptoRates();
  }

  formatCryptoResponse(crypto, code, isSpecific = false) {
    const change = parseFloat(crypto.change);
    const changeIcon = change > 0 ? "🟢" : change < 0 ? "🔴" : "🟡";

    if (isSpecific) {
      return `₿ ${crypto.name} (${code})
            
Цена: $${crypto.usd}
Изменение за 24ч: ${changeIcon} ${change}%
Рыночная капитализация: $${crypto.market_cap}
Ранг: #${crypto.rank}

📊 Источник: CoinCap.io
🕐 Данные в реальном времени`;
    }

    return `${crypto.rank}. ${crypto.name} (${code})
   💵 $${crypto.usd} ${changeIcon} ${change}%
   📊 Капитализация: $${crypto.market_cap}`;
  }

  async getCryptoDataFormatted() {
    const crypto = await this.getAllCrypto();
    if (!crypto) return "Не удалось получить курсы криптовалют";

    let result = `₿ Топ-10 криптовалют\n\n`;

    Object.entries(crypto).forEach(([symbol, data]) => {
      result += this.formatCryptoResponse(data, symbol) + "\n\n";
    });

    result += `📊 Источник: CoinCap.io\n`;
    result += `🕐 Данные в реальном времени`;

    return result;
  }
}

module.exports = new CryptoService();
