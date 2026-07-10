let aiInstance = null;

async function getAI() {
  if (aiInstance) return aiInstance;

  const { GoogleGenAI } = await import("@google/genai");

  aiInstance = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
  });

  return aiInstance;
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function generateContentWithRetry(contents) {
  const ai = await getAI();

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];

  for (let model of models) {
    let retries = 3;

    while (retries > 0) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
        });

        return response.text;
      } catch (err) {
        // 🔁 503 → yoğunluk
        if (err.status === 503) {
          console.log(`⏳ ${model} yoğun...`);
          await sleep(2000);
          retries--;
        }

        // ❌ 404 → model yok
        else if (err.status === 404) {
          console.log(`❌ ${model} yok, geçiliyor`);
          break;
        }

        // 🚫 429 → quota
        else if (err.status === 429) {
          const retryDelay =
            err?.details?.find((d) => d["@type"]?.includes("RetryInfo"))
              ?.retryDelay || "5s";

          const waitMs = parseInt(retryDelay) * 1000 || 5000;

          console.log(`🚫 Quota doldu, ${waitMs}ms bekleniyor...`);

          await sleep(waitMs);
          retries--;
        }

        else {
          throw err;
        }
      }
    }
  }

  throw new Error("AI servisi şu anda kullanılamıyor");
}

module.exports = {
  generateContentWithRetry,
};