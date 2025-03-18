const GenAI = require("@google/generative-ai");
const { TwitterApi } = require("twitter-api-v2");
const SECRETS = require("./SECRETS");

const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

const generationConfig = {
  maxOutputTokens: 400,
};
const genAI = new GenAI.GoogleGenerativeAI(SECRETS.GEMINI_API_KEY);

async function run() {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig,
  });

  const prompt = `
    Sprawdź najważniejsze, rzeczywiste mecze i wydarzenia sportowe z dzisiejszego dnia.
    Jeśli istnieją POTWIERDZONE wydarzenia o znaczeniu międzynarodowym lub krajowym:
    - Stwórz tweet w języku polskim
    - Ogranicz do 280 znaków
    - Dodaj informację o moletv.fun
    - Podaj tylko faktyczne rezultaty i wydarzenia
    
    Jeśli NIE MA żadnych istotnych wydarzeń:
    - Zwróć dokładnie: "BRAK_WYDARZEN"

    Przed odpowiedzią upewnij się:
    1. Sprawdź aktualne wyniki i harmonogramy
    2. Zweryfikuj źródła informacji
    3. Unikaj przewidywań lub niepotwierdzonych doniesień
  `;

  try {
    console.log("[AI] Rozpoczynam generowanie odpowiedzi...");
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Nowe: Pełna odpowiedź AI
    console.log("\n[AI] Pełna odpowiedź API:", JSON.stringify(response, null, 2));
    
    const text = response.text().trim();
    console.log("\n[AI] Wyekstrahowany tekst:", text);

    if (text === "BRAK_WYDARZEN") {
      console.log("[SYSTEM] Brak wydarzeń - anulowano tweet");
      return;
    }

    if (text.length > 280) {
      console.error("[BŁĄD] Przekroczono limit znaków:", text.length);
      return;
    }

    if (/brak|nic|niewartościowych/i.test(text)) {
      console.log("[SYSTEM] Wykryto potencjalnie pustą odpowiedź");
      return;
    }

    console.log("[SYSTEM] Wysyłam tweet:", text);
    sendTweet(text);

  } catch (error) {
    console.error("[BŁĄD] Problem z AI:", error);
  }
}

async function sendTweet(tweetText) {
  try {
    const tweet = await twitterClient.v2.tweet(tweetText);
    console.log("[SUKCES] Tweet wysłany:", tweet.data.text);
  } catch (error) {
    console.error("[BŁĄD] Twitter API:", error);
  }
}

run();
