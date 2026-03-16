const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

const SOURCES = {
  reuters: "https://www.reuters.com/",
  cnbcWorld: "https://www.cnbc.com/world/?region=world",
  fxEmpireGold: "https://www.fxempire.com/commodities/gold",
  tradingViewNews: "https://www.tradingview.com/news/"
};

app.get("/", (req,res)=>{
  res.json({status:"API online"});
})

app.get("/sources", (req, res) => {
  res.json(SOURCES);
});

app.post("/news/fetch", async (req, res) => {

  try{

    const {source} = req.body;

    if(!SOURCES[source]){
      return res.status(400).json({error:"source non valida"})
    }

    const url = SOURCES[source]

    const response = await axios.get(url,{
      headers:{
        "User-Agent":"Mozilla/5.0"
      }
    })

    const html = response.data

    const $ = cheerio.load(html)

    const title = $("title").text()

    const links = []

    $("a").each((i,el)=>{

      const link = $(el).attr("href")
      const text = $(el).text().trim()

      if(link && text){
        links.push({
          title:text,
          url:link
        })
      }

    })

    res.json({
      source,
      url,
      title,
      links:links.slice(0,20)
    })

  }catch(e){

    res.status(500).json({
      error:"errore fetch",
      message:e.message
    })

  }

})

app.listen(PORT,()=>{
  console.log("server running")
})
