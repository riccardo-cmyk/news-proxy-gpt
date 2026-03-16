const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const SOURCES = [
  {
    name: "Reuters",
    url: "https://www.reuters.com/markets/commodities/"
  },
  {
    name: "CNBC",
    url: "https://www.cnbc.com/commodities/"
  },
  {
    name: "FXEmpire",
    url: "https://www.fxempire.com/commodities/gold"
  },
  {
    name: "TradingView",
    url: "https://www.tradingview.com/news/"
  }
];

function extractLinks(html, baseUrl, sourceName) {

  const $ = cheerio.load(html);

  const links = [];

  $("a").each((i, el) => {

    const title = $(el).text().trim();
    const href = $(el).attr("href");

    if (!title || title.length < 20) return;
    if (!href) return;

    try {

      const url = new URL(href, baseUrl).href;

      links.push({
        source: sourceName,
        title: title.substring(0, 200),
        url: url
      });

    } catch (e) {}

  });

  return links.slice(0, 10);

}

async function fetchSource(source) {

  try {

    const response = await axios.get(source.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      },
      timeout: 15000
    });

    const html = response.data;

    return extractLinks(html, source.url, source.name);

  } catch (error) {

    console.log("error fetching", source.name);

    return [];

  }

}

async function aggregateNews(limit = 8) {

  const results = await Promise.all(SOURCES.map(fetchSource));

  const flat = results.flat();

  return flat.slice(0, limit);

}

app.get("/", (req, res) => {

  res.json({
    status: "API online"
  });

});

app.get("/news/latest", async (req, res) => {

  try {

    const topic = req.query.topic || "gold";
    const limit = parseInt(req.query.limit) || 8;

    const articles = await aggregateNews(limit);

    res.json({
      topic,
      fetchedAt: new Date().toISOString(),
      total: articles.length,
      sources: SOURCES.map(s => s.name),
      articles
    });

  } catch (error) {

    res.status(500).json({
      error: "news_fetch_failed",
      message: error.message
    });

  }

});

app.get("/news/gold-digest", async (req, res) => {

  try {

    const articles = await aggregateNews(6);

    const summary =
      "Latest macro and commodity headlines affecting the gold market including inflation expectations, interest rates, USD strength and geopolitical risk.";

    res.json({

      fetchedAt: new Date().toISOString(),

      bias: "neutral",

      summary,

      keyDrivers: [
        "US Dollar strength",
        "Interest rate expectations",
        "Inflation outlook",
        "Geopolitical risk"
      ],

      articles

    });

  } catch (error) {

    res.status(500).json({
      error: "digest_failed",
      message: error.message
    });

  }

});

app.listen(PORT, () => {

  console.log("server running on port", PORT);

});
