'use strict';
require('dotenv').config()

const https = require('https');
const { key, cert } = require('openssl-self-signed-certificate');

const { app } = require('./src/api');
const port = (process.env.PORT || 3000) + 1;

const options = { key, cert };

https.createServer(options, app).listen(port);
console.log(`HTTPS started on port ${port} (dev only).`);
