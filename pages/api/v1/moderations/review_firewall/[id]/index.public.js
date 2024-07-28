import nextConnect from 'next-connect';

import authentication from 'models/authentication';
import authorization from 'models/authorization';
import cacheControl from 'models/cache-control';
import controller from 'models/controller';
import firewall from 'models/firewall';
import validator from 'models/validator';

export default nextConnect({
  attachParams: true,
  onNoMatch: controller.onNoMatchHandler,
  onError: controller.onErrorHandler,
})
  .use(controller.injectRequestMetadata)
  .use(controller.logRequest)
  .use(authentication.injectAnonymousOrUser)
  .post(cacheControl.noCache, postValidationHandler, authorization.canRequest('review:firewall'), postHandler);

function postValidationHandler(request, response, next) {
  const cleanQueryValues = validator(request.query, {
    id: 'required',
  });

  const cleanBodyValues = validator(request.body, {
    firewall_review_action: 'required',
  });

  request.query = cleanQueryValues;
  request.body = cleanBodyValues;

  next();
}

async function postHandler(request, response) {
  const eventId = request.query.id;
  const action = request.body.action;
  const originatorIp = request.context.clientIp;
  const originatorUserId = request.context.user.id;

  const firewallData = await firewall.reviewEvent({
    eventId,
    action,
    originatorIp,
    originatorUserId,
  });

  const secureOutputValues = authorization.filterOutput(request.context.user, 'read:firewall', firewallData);

  return response.status(200).json(secureOutputValues);
}
