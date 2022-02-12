'use strict';

const express = require("express");
const serverless = require("serverless-http");

const app = express();
app.use(express.json());

app.get('/healthcheck', async function (req, res) {
  // Nothing special - just making sure everything is wired up properly.
  res.json({ status: 'green' });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
