'use strict';
const { expect } = require('chai');
const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

const { app } = require('../src/api');

describe('/', function() {
  describe('api/', function() {
    describe('users/', function() {
      describe('GET /users/:id', function() {
        it('responds with dummy data', async function() {
          const id = uuidv4();
          const response = await request(app)
            .get(`/api/users/${id}`)
            .set('Accept', 'application/json');

          expect(response.headers['content-type']).to.match(/application\/json/);
          expect(response.status).to.equal(200);
          expect(response.body).to.deep.equal({
            id,
            name: `name-of-${id}`,
            age: 20,
            tags: ['programmer'],
          });
        });
      });
    });
  });

  describe('healthcheck/', function() {
    it('responds', async function() {
      const response = await request(app)
        .get('/healthcheck')
        .set('Accept', 'application/json');

      expect(response.headers['content-type']).to.match(/application\/json/);
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ status: 'green' });
    });
  });
});
