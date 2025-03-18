const { TwitterApi } = require("twitter-api-v2");
const axios = require("axios");
const fs = require("fs");
const SECRETS = require("./SECRETS");

// Konfiguracja Twitter Client
const twitterClient = new TwitterApi({
  appKey: SECRETS.APP_KEY,
  appSecret: SECRETS.APP_SECRET,
  accessToken: SECRETS.ACCESS_TOKEN,
  accessSecret: SECRETS.ACCESS_SECRET,
});

// Konfiguracja
const CONFIG = {
  HISTORY_FILE: "./tweet_history.json",
  TWEET_COOLDOWN: 15 * 60 * 1000, // 15 minut
  NEWS_API_KEY: "dc4957d501d941a2b3f976390a6a9cc4",
  SPORTS: ["football", "basketball", "tennis", "volleyball"]
};

async function getSportsEvents() {
  try {
    const today = new Date().toLocaleDateString('en-GB');
    const query = `today ${CONFIG.SPORTS.join(' ')} events ${today}`;
    
    const ddgResponse = await axios.get(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&kp=1&no_html=1&t=sportsbot`
    );

    const events = [];

    // Parsuj wyniki DuckDuckGo
    if (ddgResponse.data?.Results) {
      ddgResponse.data.Results.forEach(result => {
        if (result.Text && result.FirstURL) {
          events.push({
            title: cleanText(result.Text),
            url: result.FirstURL
          });
        }
      });
    }

    if (events.length < 3) {
      const newsResponse = await axios.get(
        `https://newsapi.org/v2/everything?q=${CONFIG.SPORTS.join(' OR ')}&language=en&sortBy=publishedAt&apiKey=${CONFIG.NEWS_API_KEY}`
      );
      
      newsResponse.data.articles.forEach(article => {
        if (article.title.match(/vs|versus|match|game/i)) {
          events.push({
            title: `📰 ${cleanText(article.title)}`,
            url: article.url
          });
        }
      });
    }

    return events.slice(0, 3);
  } catch (error) {
    console.error("Błąd pobierania:", error.message);
    return [];
  }
}

function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .replace(/( vs )/gi, ' 🆚 ')
    .replace(/(\d+-\d+)/, '[$1]')
    .replace(/\b(?:live|score|update)\b/gi, '')
    .trim()
    .slice(0, 80);
}

async function createTweet() {
  try {
    const events = await getSportsEvents();
    
    if (events.length === 0) {
      return "🏐⚽🏀 Najciekawsze wydarzenia sportowe już wkrótce! Śledź nas na moletv.fun!";
    }

    let tweet = `🏆 Sportowe Hity (${new Date().toLocaleDateString('pl-PL')}):\n\n`;
    events.forEach((event, index) => {
      tweet += `${index + 1}. ${event.title}\n`;
    });
    
    tweet += "\n🌍 Transmisje: moletv.fun";
    
    return tweet.slice(0, 280).trim();
  } catch (error) {
    console.error("Błąd tworzenia:", error);
    return null;
  }
}

function checkCooldown() {
  try {
    if (fs.existsSync(CONFIG.HISTORY_FILE)) {
      const history = JSON.parse(fs.readFileSync(CONFIG.HISTORY_FILE));
      const lastTweetTime = new Date(history.lastTweet).getTime();
      return Date.now() - lastTweetTime < CONFIG.TWEET_COOLDOWN;
    }
    return false;
  } catch (error) {
    return true;
  }
}

async function sendTweet(tweetText) {
  try {
    if (checkCooldown()) {
      console.log("Czekaj na następny tweet...");
      return;
    }

    await twitterClient.v2.tweet(tweetText);
    
    fs.writeFileSync(CONFIG.HISTORY_FILE, JSON.stringify({
      lastTweet: new Date().toISOString(),
      lastContent: tweetText
    }));
    
    console.log("Tweet wysłany!");
  } catch (error) {
    console.error("Błąd wysyłania:", error.data?.detail || error.message);
  }
}

async function run() {
  try {
    const tweetText = await createTweet();
    if (tweetText) {
      console.log("Gotowy tweet:\n", tweetText);
      await sendTweet(tweetText);
    }
  } catch (error) {
    console.error("Krytyczny błąd:", error);
  }
}

run();
