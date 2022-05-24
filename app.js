require("dotenv").config();
const axios = require("axios");

const express = require("express");
const app = express();

// setting middlewares
app.use(express.json());

DEFAULT_EXPIRATION = 60 * 60;

// redis implementation
const redis = require("async-redis");

const redisClient = redis.createClient({
  host: process.env.HOST,
  port: process.env.REDIS_PORT,
});

app.get("/", (req, res) => {
  res.end("Welcome to the backend");
});

app.post("/api/v1/posts", async (req, res) => {
  const { id, title, body } = req.body;
  if (!id || !title || !body) {
    return res.status(400).json("Please provide all the values");
  }

  // saving data to redis
  await redisClient.setex(
    id,
    DEFAULT_EXPIRATION,
    JSON.stringify({ id, title, body })
  );
  res.status(201).json({ message: "Post was create successfully" });
});

app.get("/api/v1/posts/:id", async (req, res) => {
  const { id: postId } = req.params;
  const post = await redisClient.get(postId);
  if (!post) {
    try {
      const response = await axios.get(
        `https://jsonplaceholder.typicode.com/posts/${postId}`
      );
      const post = response.data;

      // saving to redis
      await redisClient.setex(postId, DEFAULT_EXPIRATION, JSON.stringify(post));
      return res.status(200).json(post);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: "Something went wront" });
    }
  }

  res.status(200).json(JSON.parse(post));
});

const PORT = process.env.port || 5000;

app.listen(PORT, console.log(`Server is running on port ${PORT}`));
