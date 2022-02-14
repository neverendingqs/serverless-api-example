'use strict';
const chai = require('chai');
const express = require('express');
const request = require('supertest');
const sinon = require('sinon');
const { v4: uuidv4 } = require('uuid');

chai.use(require('sinon-chai'));
const expect = chai.expect;

const ddbAttributeNames = require('../../src/lib/ddb-attribute-names');
const usersRouter = require('../../src/routes/users');

describe('/api', function() {
  describe('/users', function() {
    before(function() {
      this.ddb = {
        getItem: sinon.stub(),
        putItem: sinon.stub(),
        deleteItem: sinon.stub(),
      };

      this.usersTable = 'usersTable';

      this.app = express();
      this.app.use('/api/users', usersRouter({ ddb: this.ddb, usersTable: this.usersTable }));
    });

    afterEach(function() {
      sinon.restore();
    });

    describe('GET /api/users/:id', function() {
      it('returns 200 with user if exists in DDB', async function() {
        const id = uuidv4();
        const expectedResponse = {
          age: 10,
          id,
          name: 'Ash Ketchum',
          tags: ['champion', 'trainer'],
        };

        this.ddb.getItem
          .withArgs({
            TableName: this.usersTable,
            Key: {
              [ddbAttributeNames.userId]: { S: id },
            },
            ConsistentRead: false,
          })
          .returns({
            promise: sinon
              .stub()
              .resolves({
                Item: {
                  [ddbAttributeNames.age]: { N: `${expectedResponse.age}` },
                  [ddbAttributeNames.name]: { S: expectedResponse.name },
                  [ddbAttributeNames.tags]: { SS: expectedResponse.tags },
                  [ddbAttributeNames.userId]: { S: id },
                },
              })
          });

        const response = await request(this.app)
          .get(`/api/users/${id}`)
          .set('Accept', 'application/json');

        expect(response.headers['content-type']).to.match(/application\/json/);
        expect(response.status).to.equal(200);
        expect(response.body).to.deep.equal(expectedResponse);
      });

      it('returns 404 if user does not exist in DDB', async function() {
        const id = uuidv4();

        this.ddb.getItem
          .withArgs({
            TableName: this.usersTable,
            Key: {
              [ddbAttributeNames.userId]: { S: id },
            },
            ConsistentRead: false,
          })
          .returns({
            promise: sinon
              .stub()
              .resolves({})
          });

        const response = await request(this.app)
          .get(`/api/users/${id}`)
          .set('Accept', 'application/json');

        expect(response.headers['content-type']).to.match(/application\/json/);
        expect(response.status).to.equal(404);
        expect(response.body).to.deep.equal({
          error: 'User not found.',
          userId: id,
        });
      });

      it('returns 500 on unexpected DDB errors', async function() {
        const id = uuidv4();
        this.ddb.getItem
          .withArgs({
            TableName: this.usersTable,
            Key: {
              [ddbAttributeNames.userId]: { S: id },
            },
            ConsistentRead: false,
          })
          .returns({
            promise: sinon
              .stub()
              .rejects(new Error('Oops, I did it again.'))
          });

        const response = await request(this.app)
          .get(`/api/users/${id}`)
          .set('Accept', 'application/json');

        expect(response.headers['content-type']).to.match(/application\/json/);
        expect(response.status).to.equal(500);
        expect(response.body).to.deep.equal({
          error: 'Error occurred while retrieving user',
          userId: id,
        });
      });
    });

    describe('PUT /api/users/:id', function() {
      // TODO
    });

    describe('DELETE /api/users/:id', function() {
      // TODO
    });
  });
});
