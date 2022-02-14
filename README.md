# serverless-api-example

_TODO: improve docs_.

## Setup

* Configure AWS credentials
* Create a `.env` file to automatically load environment variables (e.g. `AWS_PROFILE`)
* Run `npm i`

## Local Development

### Unit Tests

```sh
npm test
```

### Local Server

```sh
npm run serve
```

### End-to-End Tests

Local server must be running.

```sh
npm run sls -- api test --host http://localhost:3000
```

## Cloud Development

```sh
npm run sls -- deploy --stage <stage-name>
npm run sls -- api test --stage <stage-name>
```
