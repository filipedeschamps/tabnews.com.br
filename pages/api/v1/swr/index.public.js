import { createRouter } from 'next-connect';

import cacheControl from 'models/cache-control';
import controller from 'models/controller';

export default createRouter().use(cacheControl.noCache).get(getHandler).handler(controller.handlerOptions);

function getHandler(req, res) {
  res.status(200).json({ timestamp: Date.now() });
}
