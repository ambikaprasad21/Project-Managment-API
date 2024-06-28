const express = require("express");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });

const app = express();

app.use((req, res, next) => {
  console.log("👋 Hello this is new Project managemnt server");
});

module.exports = app;
