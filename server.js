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
  const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
    const { data } = await axios.get(
      "https://jsonplaceholder.typicode.com/photos",
      { params: { albumId } }
    );
    return data;
  });
  res.json(photos);
});

// app.get("/photos", async (req, res) => {
//   const albumId = req.query.albumId;

//   const photos = await redisClient.get(`photos?albumId=${albumId}`);

//   if (photos != null) {
//     console.log("Cache Hit");
//     return res.json(JSON.parse(photos));
//   } else {
//     console.log("Cache Miss");
//     const { data } = await axios.get(
//       "https://jsonplaceholder.typicode.com/photos",
//       { params: { albumId } }
//     );
//     await redisClient.setEx(
//       `photos?albumId=${albumId}`,
//       EXPIRATION,
//       JSON.stringify(data)
//     );
//     res.json(data);
//   }
// });

app.get("/photos/:id", async (req, res) => {
  const photo = await getOrSetCache(`photos:${req.params.id}`, async () => {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    );
    return data;
  });

  res.json(photo);
});

function getOrSetCache(key, callback) {
  return new Promise(async (resolve, reject) => {
    const data = await redisClient.get(key);

    if (data != null) return resolve(JSON.parse(data));
    const freshData = await callback();
    redisClient.setEx(key, EXPIRATION, JSON.stringify(freshData));
    resolve(freshData);
  });
}

app.listen(3000, () => {
  console.log("Listening on Port 3000");
});
