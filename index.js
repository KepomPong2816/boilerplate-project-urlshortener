const express = require("express");
const cors = require("cors");
const dns = require("dns");
const { URL } = require("url");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const urlDatabase = {};
let urlCounter = 1;

function isValidHttpUrl(userInput) {
  let url;
  try {
    url = new URL(userInput);
  } catch (err) {
    return false;
  }
  return url.protocol === "http:" || url.protocol === "https:";
}

app.post("/api/shorturl", (req, res) => {
  const submittedUrl = req.body.url;

  if (!isValidHttpUrl(submittedUrl)) {
    return res.json({ error: "invalid url" });
  }

  const hostname = new URL(submittedUrl).hostname;

  dns.lookup(hostname, (err, address) => {
    if (err || !address) {
      return res.json({ error: "invalid url" });
    }

    for (const [key, value] of Object.entries(urlDatabase)) {
      if (value === submittedUrl) {
        return res.json({ original_url: value, short_url: Number(key) });
      }
    }

    urlDatabase[urlCounter] = submittedUrl;

    res.json({
      original_url: submittedUrl,
      short_url: urlCounter++,
    });
  });
});

app.get("/api/shorturl/:short_url", (req, res) => {
  const id = req.params.short_url;
  const originalUrl = urlDatabase[id];

  if (!originalUrl) {
    return res.json({ error: "invalid url" });
  }

  res.redirect(originalUrl);
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
