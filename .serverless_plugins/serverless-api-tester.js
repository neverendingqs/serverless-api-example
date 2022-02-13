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

  async test() {
    const host = this.options.host || await this._getApiHost();

    await this._runHealthcheck({ host });

    const id = uuidv4();
    const response = await fetch(`${host}/api/users/${id}`);

    expect(response.headers.get('content-type')).to.match(/application\/json/);
    expect(response.status).to.equal(200);

    const body = await response.json();
    expect(body).to.deep.equal({
      id,
      name: `name-of-${id}`,
      age: 20,
      tags: ['programmer'],
    });

    this.log.notice('All tests passed!');
  }
}

module.exports = ServerlessApiTester;
