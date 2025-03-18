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

// API url for getting real-time sports data (replace with actual API endpoint)
const sportsApiUrl = "https://api.football-data.org/v4/matches"; // Example, use real API endpoint
const apiKey = SECRETS.FOOTBALL_API_KEY; // API key for sports data

async function getSportsData() {
  try {
    const response = await axios.get(sportsApiUrl, {
      headers: {
        "X-Auth-Token": apiKey,
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
  
  if (!sportsData || !sportsData.matches || sportsData.matches.length === 0) {
    console.log("No upcoming matches or events found.");
    return;
  }

  // Take the first match to generate a tweet
  const matchInfo = sportsData.matches[0];
  const matchText = `${matchInfo.homeTeam.name} vs ${matchInfo.awayTeam.name} - ${matchInfo.utcDate}. Watch it now on moletv.fun!`;

  // Generate tweet using the real match information
  const prompt = `
    Napisz tweet o najważniejszych, rzeczywistych meczach i wydarzeniach sportowych z dzisiejszego dnia. 
    Wybierz tylko te, które są potwierdzone przez wiarygodne źródła. 
    Ogranicz tekst do 280 znaków. 
    Podaj informację, że można je obejrzeć na moletv.fun. 
    Przykład: ${matchText}
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
