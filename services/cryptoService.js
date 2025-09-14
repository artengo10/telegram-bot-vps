const axios = require("axios");

class CryptoService {
  constructor() {
    this.cryptoMap = {
      биткоин: "BTC",
      bitcoin: "BTC",
      btc: "BTC",
      эфир: "ETH",
      ethereum: "ETH",
      eth: "ETH",
      usdt: "USDT",
      тетер: "USDT",
      tether: "USDT",
      bnb: "BNB",
      solana: "SOL",
      sol: "SOL",
      cardano: "ADA",
      ada: "ADA",
      ripple: "XRP",
      xrp: "XRP",
      доги: "DOGE",
      dogecoin: "DOGE",
      doge: "DOGE",
      polkadot: "DOT",
      dot: "DOT",
      litecoin: "LTC",
      ltc: "LTC",
    };
  }

  async getCryptoRates() {
    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h",
        { timeout: 8000 }
      );

      const cryptoData = response.data;
      const rates = {};

      cryptoData.forEach((coin) => {
        rates[coin.symbol.toUpperCase()] = {
          name: coin.name,
          usd: coin.current_price.toLocaleString(),
          change: coin.price_change_percentage_24h.toFixed(2),
          market_cap: this.formatMarketCap(coin.market_cap),
          rank: coin.market_cap_rank,
        };
      });

      return rates;
    } catch (error) {
      console.error("Ошибка получения курсов крипты:", error.message);
      return await this.getCryptoRatesBackup();
    }
  }

  formatMarketCap(marketCap) {
    if (marketCap >= 1e12) return (marketCap / 1e12).toFixed(2) + " трлн";
    if (marketCap >= 1e9) return (marketCap / 1e9).toFixed(2) + " млрд";
    if (marketCap >= 1e6) return (marketCap / 1e6).toFixed(2) + " млн";
    return marketCap.toLocaleString();
  }

  matchCrypto(query) {
    for (const [key, crypto] of Object.entries(this.cryptoMap)) {
      if (query.includes(key)) {
        return crypto;
      }
    }
    return null;
  }

  async getSpecificCrypto(cryptoCode) {
    const crypto = await this.getCryptoRates();
    if (!crypto || !crypto[cryptoCode]) {
      return null;
    }
    return crypto[cryptoCode];
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

📊 Источник: CoinGecko
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

    result += `📊 Источник: CoinGecko API\n`;
    result += `🕐 Данные в реальном времени`;

    return result;
  }

  async getCryptoRatesBackup() {
    try {
      const response = await axios.get(
        "https://api.binance.com/api/v3/ticker/24hr",
        { timeout: 5000 }
      );

      const prices = response.data;
      const top10 = prices
        .filter((p) => p.symbol.endsWith("USDT"))
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);

      const rates = {};
      top10.forEach((coin, index) => {
        const symbol = coin.symbol.replace("USDT", "");
        rates[symbol] = {
          name: symbol,
          usd: parseFloat(coin.lastPrice).toLocaleString(),
          change: parseFloat(coin.priceChangePercent).toFixed(2),
          market_cap: this.formatMarketCap(
            parseFloat(coin.volume) * parseFloat(coin.lastPrice)
          ),
          rank: index + 1,
        };
      });

      return rates;
    } catch (error) {
      console.error("Резервный метод тоже не сработал:", error.message);
      return null;
    }
  }
}

module.exports = new CryptoService();
