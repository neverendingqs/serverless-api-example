'use strict';
const { expect } = require('chai');
const request = require('supertest');

const { app } = require('../src/api');

describe('api', function() {
  describe('/healthcheck', function() {
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
