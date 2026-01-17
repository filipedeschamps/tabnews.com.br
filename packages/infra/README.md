# @tabnews/infra

## Logger

Sends logs to the `console`, `stdout`, or Axiom, depending on the environment.

| Environment | Destination | Level   | Notes                                                                          |
| ----------- | ----------- | ------- | ------------------------------------------------------------------------------ |
| Local       | `console`   | != info | Enable "info" level using the `LOG_LEVEL=info` environment variable.           |
| Vercel Edge | `stdout`    | >= info | Logs sent to `stdout` are forwarded to Axiom if the integration is configured. |
| Vercel Node | Axiom API   | >= info | Falls back to `stdout` if `AXIOM_TOKEN` or `AXIOM_DATASET` are missing.        |

### Configuration

Initialize the configuration by providing options compatible with the [pino logger](https://getpino.io/).

```js
import { getLogger } from '@tabnews/infra';

const logger = getLogger({
  // pino options
});
```

### Usage Example

```js
logger.info('Log sent asynchronously to Axiom');
logger.error(error);

// Ensures Vercel waits for logs to be sent to Axiom before terminating the lambda
logger.flush();
```
