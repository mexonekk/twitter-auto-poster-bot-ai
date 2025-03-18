const axios = require("axios");
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

// API URL for getting real-time sports data (replace with actual API endpoint)
const sportsApiUrl = "https://v3.football.api-sports.io/matches"; // API-Sports endpoint
const apiKey = SECRETS.API_SPORTS_KEY; // API key for API-Sports

async function getSportsData() {
  try {
    const response = await axios.get(sportsApiUrl, {
      headers: {
        "x-apisports-key": apiKey, // Correct API-Sports header
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching sports data:", error);
    return null;
  }
}

async function generateTweet() {
  const sportsData = await getSportsData();

  if (!sportsData || !sportsData.response || sportsData.response.length === 0) {
    console.log("No upcoming matches or events found.");
    return;
  }

  // Take the first match to generate a tweet
  const matchInfo = sportsData.response[0].teams;
  const matchDate = sportsData.response[0].fixture.date;
  const matchText = `${matchInfo.home.name} vs ${matchInfo.away.name} - ${matchDate}`;

  // Now, include the match info in the prompt for AI to generate a tweet
  const prompt = `
    Napisz tweet o dzisiejszych meczach sportowych, zachowując następujący schemat:
    - Drużyna domowa vs Drużyna gości - data meczu
    - Podaj, że mecz można obejrzeć na moletv.fun.
    Przykład: ${matchText} - oglądaj na moletv.fun!
    Ogranicz tekst do 280 znaków. Zadbaj, aby tekst był zwięzły i klarowny.
  `;

  // Generate content using GenAI
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig,
  });

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const tweetText = response.text();

  console.log("Generated Tweet:", tweetText);

  // Send the generated tweet
  sendTweet(tweetText);
}

async function sendTweet(tweetText) {
  try {
    await twitterClient.v2.tweet(tweetText);
    console.log("Tweet sent successfully!");
  } catch (error) {
    console.error("Error sending tweet:", error);
  }
}

generateTweet();
