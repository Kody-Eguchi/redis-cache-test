const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Redis = require("redis");

const redisClient = Redis.createClient();
const EXPIRATION = 3600;

// After Redis version 4.2.0, you have to manually code client.connect() NO LONGER AUTOMATIC
redisClient.connect();

const app = express();
app.use(cors());

app.get("/photos", async (req, res) => {
  const albumId = req.query.albumId;

  const photos = await redisClient.get("photos");

  if (photos != null) {
    console.log("Cache Hit");
    return res.json(JSON.parse(photos));
  } else {
    console.log("Cache Miss");
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      { params: { albumId } }
    );
    await redisClient.setEx("photos", EXPIRATION, JSON.stringify(data));
    res.json(data);
  }
});

app.get("/photos/:id", async (req, res) => {
  const albumId = req.query.albumId;
  const { data } = await axios.get(
    `https://jsonplaceholder.typicode.com/photos/${req.params.id}`,
    { params: { albumId } }
  );

  res.json(data);
});

app.listen(3000, () => {
  console.log("Listening on Port 3000");
});
