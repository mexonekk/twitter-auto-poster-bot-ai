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
  "Stwórz kreatywne, angażujące tweety (w języku polskim) zachęcające do odwiedzenia strony moletv.fun, gdzie można całkowicie za darmo oglądać mecze piłkarskie i inne wydarzenia sportowe. Pamiętaj o:Limit 280 znaków – treść musi być zwięzła i dynamiczna.Emoji i estetyka: Użyj symboli związanych z piłką nożną (⚽, 🔥), emotikon (🎉, 🏆), oraz ikon technologii (💻, 📱). Unikaj przesady.Keywory: Wpleć nazwy lig (Liga Mistrzów, Premier League, La Liga, Bundesliga, Ekstraklasa) oraz hasła: „za darmo”, „na żywo”, „bez opłat”, „streaming”.Różnorodność formatów:Pytania: „Czy wiesz, gdzie obejrzysz dziś mecz za darmo? 🧐”Fakty: „Liga Mistrzów GRATIS? Tylko na moletv.fun! ✅”Call-to-action: „Kliknij, zanim mecz się zacznie! ⏳”Emocje: „GOL! 🥳 I cały mecz oglądaj BEZ LIMITÓW na moletv.fun!”CTA i link: Zawsze dodaj „moletv.fun” oraz wezwania typu „Sprawdź teraz!”, „Nie przegap!”.Przykładowy tweet:⚽🏆 MECZE ZA DARMO!Premier League, Mundial, La Liga – wszystkie na moletv.fun!🚨 Nie płacisz złotówki, a oglądasz w jakości HD!👉 Klikaj, zanim ktoś zdąży Ci powiedzieć „ofsajd”!Uwaga: Unikaj słów „piratstwo” – skup się na legalności i dostępności. Tekst ma być przyjazny, ale profesjonalny.";

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
