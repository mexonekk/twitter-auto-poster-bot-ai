const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");
const SECRETS = require("./SECRETS");

const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

async function getSportsEvents() {
  const today = new Date().toISOString().split('T')[0];
  const response = await axios.get(`https://api.duckduckgo.com/?q=wydarzenia+sportowe+${today}+piłka+nożna+koszykówka+tenis&format=json&no_redirect=1`);
  
  const events = [];
  // Przetwarzanie wyników z DuckDuckGo
  if (response.data.RelatedTopics) {
    response.data.RelatedTopics.forEach(topic => {
      if (topic.FirstURL && topic.Text) {
        events.push({
          title: topic.Text.replace(/<[^>]+>/g, ''), // Usuwanie HTML
          url: topic.FirstURL
        });
      }
    });
  }
  return events.slice(0, 3); // Zwróć 3 najważniejsze wydarzenia
}

async function createTweet() {
  const events = await getSportsEvents();
  if (events.length === 0) return "Brak ważnych wydarzeń sportowych dziś.";
  
  let tweet = `⚽ Najważniejsze wydarzenia sportowe (${new Date().toLocaleDateString()}):\n`;
  events.forEach(event => {
    tweet += `• ${event.title}\n`;
  });
  tweet += "\nTransmisje: moletv.fun";
  
  // Skracanie do 280 znaków
  return tweet.slice(0, 280);
}

async function run() {
  try {
    const tweetText = await createTweet();
    console.log(tweetText);
    await sendTweet(tweetText);
  } catch (error) {
    console.error("Error:", error);
  }
}

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet wysłany!");
  } catch (error) {
    console.error("Błąd przy wysyłaniu:", error);
  }
}

run();
