const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const ffmpeg = require("fluent-ffmpeg");
const fetch = require("node-fetch");
const FormData = require("form-data");

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

class SpeechService {
  constructor() {
    this.provider = process.env.SPEECH_PROVIDER || "yandex";
  }

  // НОВЫЙ МЕТОД ДЛЯ КОНВЕРТАЦИИ
  async convertOggToProperFormat(oggBuffer) {
    const tempOggPath = path.join("/tmp", `convert_${Date.now()}.ogg`);
    const tempWavPath = path.join("/tmp", `convert_${Date.now()}.wav`);

    try {
      await writeFileAsync(tempOggPath, oggBuffer);

      // Конвертируем в моно WAV с частотой 16000 Hz
      await new Promise((resolve, reject) => {
        ffmpeg(tempOggPath)
          .audioFrequency(16000)
          .audioChannels(1)
          .format("wav")
          .on("end", resolve)
          .on("error", reject)
          .save(tempWavPath);
      });

      return fs.readFileSync(tempWavPath);
    } finally {
      // Очистка временных файлов
      try {
        await unlinkAsync(tempOggPath);
      } catch (e) {}
      try {
        await unlinkAsync(tempWavPath);
      } catch (e) {}
    }
  }

  // Удаляем конвертацию в WAV для Yandex
  async convertOggToWav(oggBuffer) {
    // Этот метод теперь нужен только для Whisper
    const tempOggPath = path.join("/tmp", `temp_${Date.now()}.ogg`);
    const tempWavPath = path.join("/tmp", `temp_${Date.now()}.wav`);

    try {
      await writeFileAsync(tempOggPath, oggBuffer);

      await new Promise((resolve, reject) => {
        ffmpeg(tempOggPath)
          .toFormat("wav")
          .audioFrequency(16000)
          .audioChannels(1)
          .on("end", resolve)
          .on("error", reject)
          .save(tempWavPath);
      });

      return fs.readFileSync(tempWavPath);
    } finally {
      try {
        await unlinkAsync(tempOggPath);
      } catch (e) {}
      try {
        await unlinkAsync(tempWavPath);
      } catch (e) {}
    }
  }

  async recognizeWithYandex(audioBuffer) {
    try {
      console.log("🎯 START: Yandex SpeechKit recognition");
      console.log("Yandex API Key present:", !!process.env.YANDEX_API_KEY);
      console.log("Audio buffer size:", audioBuffer.length);

      // Сохраняем оригинальный OGG для отладки
      const tempOggPath = path.join("/tmp", `debug_${Date.now()}.ogg`);
      await writeFileAsync(tempOggPath, audioBuffer);
      console.log("🔧 Debug OGG file saved to:", tempOggPath);

      console.log("🔧 Конвертируем OGG в WAV...");
      const convertedBuffer = await this.convertOggToProperFormat(audioBuffer);
      console.log(
        "✅ Конвертированный WAV buffer size:",
        convertedBuffer.length
      );

      console.log("🔧 Отправляем запрос к Yandex SpeechKit...");
      const response = await fetch(
        "https://stt.api.cloud.yandex.net/speech/v1/stt:recognize?lang=ru-RU",
        {
          method: "POST",
          headers: {
            Authorization: `Api-Key ${process.env.YANDEX_API_KEY}`,
            "Content-Type": "audio/wav",
          },
          body: convertedBuffer,
        }
      );

      console.log("🔧 Yandex response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Yandex error details:", errorText);
        throw new Error(`Yandex error: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("✅ Yandex recognition result:", data);

      return data.result;
    } catch (error) {
      console.error("💥 Yandex recognition error:", error);
      throw error;
    }
  }

  async recognizeWithWhisper(audioBuffer) {
    try {
      const wavBuffer = await this.convertOggToWav(audioBuffer);

      const formData = new FormData();
      formData.append("file", wavBuffer, {
        filename: "audio.wav",
        contentType: "audio/wav",
      });
      formData.append("model", "whisper-1");
      formData.append("language", "ru");

      const response = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            ...formData.getHeaders(),
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Whisper error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error("Whisper recognition error:", error);
      throw error;
    }
  }

  async speechToText(audioBuffer) {
    try {
      if (this.provider === "whisper") {
        return await this.recognizeWithWhisper(audioBuffer);
      } else {
        return await this.recognizeWithYandex(audioBuffer);
      }
    } catch (error) {
      console.error("Speech recognition failed:", error);
      return null;
    }
  }
}

module.exports = new SpeechService();
