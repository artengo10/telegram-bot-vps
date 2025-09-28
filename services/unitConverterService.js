class UnitConverterService {
  constructor() {
    this.conversions = {
      // Длина
      length: {
        m: 1,
        km: 1000,
        cm: 0.01,
        mm: 0.001,
        mile: 1609.34,
        yard: 0.9144,
        foot: 0.3048,
        inch: 0.0254,
      },
      // Вес
      weight: {
        kg: 1,
        g: 0.001,
        mg: 0.000001,
        pound: 0.453592,
        ounce: 0.0283495,
      },
      // Температура (специальная обработка)
      temperature: {
        celsius: "c",
        fahrenheit: "f",
        kelvin: "k",
      },
    };
  }

  convertTemperature(value, from, to) {
    let celsius;
    // Конвертируем в цельсии
    switch (from) {
      case "c":
        celsius = value;
        break;
      case "f":
        celsius = ((value - 32) * 5) / 9;
        break;
      case "k":
        celsius = value - 273.15;
        break;
    }
    // Конвертируем из цельсиев
    switch (to) {
      case "c":
        return celsius;
      case "f":
        return (celsius * 9) / 5 + 32;
      case "k":
        return celsius + 273.15;
    }
  }

  parseQuery(query) {
    // Регулярные выражения для парсинга запросов
    const patterns = [
      // "100 км в мили", "50 кг в фунты"
      /(\d+\.?\d*)\s*([а-яa-z]+)\s+в\s+([а-яa-z]+)/i,
      // "100km to miles", "50kg to pounds"
      /(\d+\.?\d*)\s*([a-z]+)\s+to\s+([a-z]+)/i,
      // "32 celsius to fahrenheit"
      /(\d+\.?\d*)\s*(celsius|fahrenheit|kelvin)\s+to\s+(celsius|fahrenheit|kelvin)/i,
    ];

    for (let pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        return {
          value: parseFloat(match[1]),
          from: match[2].toLowerCase(),
          to: match[3].toLowerCase(),
        };
      }
    }
    return null;
  }

  async convert(query) {
    const data = this.parseQuery(query);
    if (!data) return null;

    const { value, from, to } = data;

    // Температура
    if (
      from in this.conversions.temperature ||
      to in this.conversions.temperature
    ) {
      const fromUnit = this.conversions.temperature[from] || from;
      const toUnit = this.conversions.temperature[to] || to;
      const result = this.convertTemperature(value, fromUnit, toUnit);
      return `${value} ${from} = ${result.toFixed(2)} ${to}`;
    }

    // Другие единицы измерения
    for (const category in this.conversions) {
      if (category === "temperature") continue;

      if (
        from in this.conversions[category] &&
        to in this.conversions[category]
      ) {
        const baseValue = value * this.conversions[category][from];
        const result = baseValue / this.conversions[category][to];
        return `${value} ${from} = ${result.toFixed(4)} ${to}`;
      }
    }

    return null;
  }
}

module.exports = new UnitConverterService();
