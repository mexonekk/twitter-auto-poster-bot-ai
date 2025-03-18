// By VishwaGauravIn (https://itsvg.in)

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
  // For text-only input, use the gemini-pro model
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig,
  });

  // Write your prompt here
  const prompt =
  "moletv.fun. W treści:Wyróżnij darmowy dostęp: słowa kluczowe jak „za darmo”, „bez opłat”, „na żywo”.Wymień 1-2 ligi/rozgrywki (np. Liga Mistrzów, Ekstraklasa, Mundial).Dodaj emoji: piłka (⚽), ogień (🔥), technologia (📱), emocje (🎉).Call-to-action: „Wejdź na moletv.fun!”, „Sprawdź teraz!”, „Nie przegap!”.Unikaj powtórzeń – każdy tweet ma być unikalny w formie (pytanie, fakt, emocje, nagłówek).Przykład:🔥⚽ Ekstraklasa ZA DARMO?Tak! Oglądaj na żywo mecze, skróty i gole na moletv.fun!📱 Nie płacisz złotówki – wystarczy kliknąć!👉 Sprawdź, zanim zacznie się derby!Uwaga: Tekst ma być dynamiczny, ale estetyczny. Unikaj słów kojarzących się z nielegalnymi treściami.";

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  console.log(text);
  sendTweet(text);
}

run();

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
  }
}
