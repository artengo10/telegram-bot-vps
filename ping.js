const https = require("https");
const url = process.env.RENDER_URL || "https://your-bot-url.onrender.com";

function pingServer() {
  https
    .get(url, (res) => {
      console.log(
        `Ping sent at ${new Date().toLocaleTimeString()}, Status: ${
          res.statusCode
        }`
      );
    })
    .on("error", (err) => {
      console.log("Ping error:", err.message);
    });
}

// Пинг каждые 10 минут
setInterval(pingServer, 10 * 60 * 1000);

// Первый пинг при запуске
setTimeout(pingServer, 5000);

module.exports = { pingServer };
