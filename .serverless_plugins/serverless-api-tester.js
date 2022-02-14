const { expect } = require('chai');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

class ServerlessApiTester {
  constructor(serverless, options, { log }) {
    this.serverless = serverless;
    this.options = options;
    this.log = log;
    this.provider = serverless.getProvider('aws');

    this.commands = {
      api: {
        usage: 'Interact with the API',
        lifecycleEvents: ['api'],
        commands: {
          test: {
            usage: 'Test the API',
            options: {
              host: {
                usage: 'Optional override for host',
                type: 'string',
              }
            },
            lifecycleEvents: ['test']
          },
        }
      },
    };

    this.hooks = {
      'api:test:test': () => this.test(),
    };
  }

  async _getApiHost() {
    const service = this.serverless.service.service;
    const stage = this.serverless.service.provider.stage;
    const stackName = `${service}-${stage}`;

    const response = await this.provider.request('CloudFormation', 'describeStacks', { StackName: stackName });
    const apiHost = response?.Stacks?.[0]?.Outputs
      ?.find(({ OutputKey }) => OutputKey === 'HttpApiUrl')
      ?.OutputValue;

    if(!apiHost) {
      throw new Error('API host not found!')
    }

    return apiHost;
  }

  async _runHealthcheck({ host }) {
    const response = await fetch(`${host}/healthcheck`);
    const body = await response.json();

    expect(response.headers.get('content-type')).to.match(/application\/json/);
    expect(response.status).to.equal(200);
    expect(body).to.deep.equal({ status: 'green' });
  }

  async _getUser({ host, id, userExists = false }) {
    const response = await fetch(`${host}/api/users/${id}`);

    expect(response.headers.get('content-type')).to.match(/application\/json/);
    if(userExists) {
      expect(response.status).to.equal(200);
    } else {
      expect(response.status).to.equal(404);
    }

    return response.json()
  }

  async _putUser({ host, id, body }) {
    const response = await fetch(`${host}/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    expect(response.status).to.equal(200);
  }

  async _deleteUser({ host, id }) {
    const response = await fetch(`${host}/api/users/${id}`, { method: 'DELETE' });
    expect(response.status).to.equal(200);
  }

  async test() {
    const host = this.options.host || await this._getApiHost();
    await this._runHealthcheck({ host });
    this.log.notice('Healthcheck successful.');

    const id = uuidv4();

    const firstGetBody = await this._getUser({ host, id, userExists: false });
    expect(firstGetBody).to.deep.equal({
      error: 'User not found.',
      userId: id,
    });
    this.log.notice(`Confirmed user '${id}' does not exist.`);

    const newUserBody = {
      age: 10,
      name: 'Ash Ketchum',
      tags: ['champion', 'trainer'],
    }

    await this._putUser({ host, id, body: newUserBody });
    this.log.notice(`Created user '${id}'.`);

    const secondGetBody = await this._getUser({ host, id, userExists: true });
    secondGetBody.tags = secondGetBody?.tags?.sort((a, b) => a.localeCompare(b));
    expect(secondGetBody).to.deep.equal({ ...newUserBody, id });
    this.log.notice(`Confirmed user '${id}' now exists.`);

    await this._deleteUser({ host, id });
    this.log.notice(`Deleted user '${id}'.`);

    const thirdGetBody = await this._getUser({ host, id, userExists: false });
    expect(thirdGetBody).to.deep.equal({
      error: 'User not found.',
      userId: id,
    });
    this.log.notice(`Confirmed user '${id}' no longer exists.`);

    this.log.notice('All tests passed!');
  }
}

module.exports = ServerlessApiTester;
