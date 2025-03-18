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
  try {
    const today = new Date().toISOString().split('T')[0];
    const query = `wydarzenia sportowe ${today} piłka nożna koszykówka tenis`;
    
    const response = await axios.get(
      `https://api.duckduckgo.com/?q=${
        encodeURIComponent(query)
      }&format=json&no_redirect=1&t=sportsbot&no_html=1`
    );

    const events = [];
    if (response.data?.RelatedTopics) {
      response.data.RelatedTopics.forEach(topic => {
        if (topic.FirstURL && topic.Text) {
          events.push({
            title: topic.Text
              .replace(/<[^>]+>/g, '') // Usuwa tagi HTML
              .replace(/\s+/g, ' ')     // Usuwa wielokrotne spacje
              .replace(/[^\x00-\x7F]/g, '') // Usuwa znaki specjalne
              .trim(),
            url: topic.FirstURL
          });
        }
      });
    }
    return events.slice(0, 3);
  } catch (error) {
    console.error("Błąd pobierania danych:", error.message);
    return [];
  }
}

async function createTweet() {
  try {
    const events = await getSportsEvents();
    
    if (events.length === 0) {
      return "Brak ważnych wydarzeń sportowych dziś. 🏟️ Sprawdź później!";
    }

    let tweet = `🗓️ Najważniejsze wydarzenia (${new Date().toLocaleDateString('pl-PL')}):\n\n`;
    events.forEach((event, index) => {
      tweet += `${index + 1}. ${event.title}\n`;
    });
    
    tweet += "\n▶️ Transmisje: moletv.fun";
    
    // Skracanie do 280 znaków
    return tweet.slice(0, 280).trim();
  } catch (error) {
    console.error("Błąd tworzenia tweetu:", error);
    return null;
  }
}

async function sendTweet(tweetText) {
  try {
    if (!tweetText || tweetText.length === 0) {
      console.log("Brak treści do opublikowania");
      return;
    }
    
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet opublikowany!");
  } catch (error) {
    console.error("Błąd publikacji:", error.data);
  }
}

async function run() {
  try {
    const tweetText = await createTweet();
    if (tweetText) {
      console.log("Wygenerowany tweet:\n", tweetText);
      await sendTweet(tweetText);
    }
  } catch (error) {
    console.error("Krytyczny błąd:", error);
  }
}

run();
