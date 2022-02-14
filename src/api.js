'use strict';

const express = require('express');
const serverless = require('serverless-http');

const usersRouter = require('./routes/users');

const app = express();

app.use(express.json());
app.use('/api/users', usersRouter());

app.get('/healthcheck', async function (req, res) {
  // Nothing special - just making sure everything is wired up properly.
  res.json({ status: 'green' });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

module.exports.app = app;
// NB: Lambda functions are short-lived, so things like caching might not work so well here
// Consider another tech if caching is important (Fargate? ECS? EC2?)
module.exports.handler = serverless(app);
