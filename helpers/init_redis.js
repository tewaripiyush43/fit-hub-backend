const redis = require("redis");

// const client = redis.createClient({
//   port: 6379,
//   host: "127.0.0.1",
// });

// import { createClient } from "redis";
const { createClient } = require("redis");

const client = createClient({
  password: "t4DOqP7jGU1C0KHnkL5vDM7Xqxv0FdT9",
  socket: {
    host: "redis-11534.c92.us-east-1-3.ec2.cloud.redislabs.com",
    port: 11534,
  },
});

client.on("connect", () => {
  console.log("Client connected to redis...");
});

client.on("ready", () => {
  console.log("Client connected to redis and ready to use...");
});

client.on("error", (err) => {
  console.log(err.message);
});

client.on("end", () => {
  console.log("Client disconnected from redis");
});

process.on("SIGINT", () => {
  console.log("Client disconnected from redis due to app termination");
  client.quit();
});

module.exports = client;
