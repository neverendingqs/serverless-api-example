'use strict';
const AWS = require('aws-sdk');
const express = require('express');

const ddbAttributeNames = require('../lib/ddb-attribute-names');

const NUM_SECONDS_7_DAYS = 7 * 1 * 24 * 60 * 60;

module.exports = function({
  // Allow for overrides for unit tests
  ddb,
  usersTable,
} = {}) {
  ddb = ddb ?? new AWS.DynamoDB();
  usersTable = usersTable ?? process.env.USERS_TABLE;

  const router = express.Router();

  // TODO: authorization. Use Express middleware, or an authorizer Lambda?

  router.get('/:id', async function(req, res) {
    const id = req.params.id;

    try {
      const { Item } = await ddb.getItem({
        TableName: usersTable,
        Key: { [ddbAttributeNames.userId]: { S: id } },
        ConsistentRead: true,
      }).promise();

      if (Item) {
        // TODO: decide which fields are required
        res.json({
          age: parseInt(Item[ddbAttributeNames.age]?.N),
          id: Item[ddbAttributeNames.userId]?.S,
          name: Item[ddbAttributeNames.name]?.S,
          tags: Item[ddbAttributeNames.tags]?.SS,
        });
      } else {
        res
          .status(404)
          .json({ error: 'User not found.', userId: id });
      }
    } catch (err) {
      console.log(err);

      res
        .status(500)
        .json({ error: 'Error occurred while retrieving user', userId: id });
    }
  });

  router.put('/:id', async function(req, res) {
    const id = req.params.id;
    const {
      age,
      name,
      tags,
    } = req.body;

    try {
      await ddb.putItem({
        TableName: usersTable,
        Item: {
          // TODO: do input validation instead of relying on DDB to do it for us
          // TODO: decide which fields are required
          // Option: https://github.com/express-validator/express-validator
          // Option: https://github.com/andrewkeig/express-validation
          [ddbAttributeNames.age]: { N: `${age}` },
          [ddbAttributeNames.name]: { S: name },
          [ddbAttributeNames.tags]: { SS: tags },
          [ddbAttributeNames.userId]: { S: id },
          // Example only, so TTL items to keep costs down
          [ddbAttributeNames.ttl]: { N: `${parseInt(new Date().getTime() / 1000) + NUM_SECONDS_7_DAYS}` }
        },
      }).promise();

      res.send(200);
    } catch (err) {
      console.log(err);

      res
        .status(500)
        .json({
          error: 'Error occurred while creating user',
          payload: req.body,
        });
    }
  });

  router.delete('/:id', async function(req, res) {
    const id = req.params.id;

    try {
      await ddb.deleteItem({
        TableName: usersTable,
        Key: { [ddbAttributeNames.userId]: { S: id } },
      }).promise();

      res.send(200);
    } catch (err) {
      console.log(err);
      res
        .status(500)
        .json({
          error: 'Error occurred while deleting user',
          id,
        });
    }
  });

  return router;
}

/*
 * Endpoint ideas:
 * - PATCH - update a user
 * - POST - create a new user with a system generated ID
 * - bulk update route, which could return a 202 and queue the work into SQS to eventually process the bulk request
 *   - NB: double-check API Gateway payload size limits when implementing this route
 */
