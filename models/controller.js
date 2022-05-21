import { v4 as uuidV4 } from 'uuid';
import session from 'models/session.js';
import logger from 'infra/logger.js';
import snakeize from 'snakeize';

import {
  InternalServerError,
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
} from '/errors/index.js';

async function injectRequestId(request, response, next) {
  request.context = { ...request.context, requestId: uuidV4() };
  next();
}

async function onNoMatchHandler(request, response) {
  const errorObject = new NotFoundError({ requestId: request.context.requestId });
  logger.info(snakeize(errorObject));
  return response.status(errorObject.statusCode).json(snakeize(errorObject));
}

function onErrorHandler(error, request, response) {
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ForbiddenError) {
    const errorObject = { ...error, requestId: request.context.requestId };
    logger.info(snakeize(errorObject));
    return response.status(error.statusCode).json(snakeize(errorObject));
  }

  if (error instanceof UnauthorizedError) {
    const errorObject = { ...error, requestId: request.context.requestId };
    logger.info(snakeize(errorObject));
    session.clearSessionIdCookie(response);
    return response.status(error.statusCode).json(snakeize(errorObject));
  }

  const errorObject = new InternalServerError({
    requestId: request.context.requestId,
    errorId: error.errorId,
    stack: error.stack,
    statusCode: error.statusCode,
    errorUniqueCode: error.errorUniqueCode,
  });

  // TODO: Understand why `sanaize` is not logging the
  // `stack` property of the error object.
  logger.error(snakeize({ ...errorObject, stack: error.stack }));

  return response.status(errorObject.statusCode).json(snakeize(errorObject));
}

function logRequest(request, response, next) {
  const { method, url, headers, query, body, context } = request;

  const log = {
    method,
    url,
    headers,
    query,
    context,
    body,
  };

  logger.info(log);

  next();
}

export function rateLimit({windowMs, maxRequests, punishMs}){
  
  const ipsController = []
  const ipsPunish = []

  function verifyIps(ip){
    
    const verifyIpPunishExists = ipsPunish.filter(i => i.ip = ip)
    if(verifyIpPunishExists .length> 0) return verfiyIsValidPunishment(verifyIpPunishExists[0])

    const verifyIpExists = ipsController.filter(i => i.ip == ip)
    if(verifyIpExists.length == 0) return setNewIP(ip)
    
    return updateIpData(verifyIpExists[0])

  }

  function updateIpData(data){
    const position = ipsController.indexOf(data)
    const creationDate = data.created_at.getTime()
    const currentDate = new Date().getTime()

    const differenceBeteweenDates = currentDate - creationDate

    if(differenceBeteweenDates > windowMs){
      ipsController.splice(position, 1)
      return setNewIP(data.ip)
    }

    if(maxRequests > data.requests){
      return ipsController.splice(position, 1, { 
          ip: data.ip, 
          created_at: data.created_at, 
          requests: data.requests + 1 
      })
    }

    if(data.requests >= maxRequests){
      setNewPunishIP(data)
    }

  }

  function setNewIP(ip){
    return ipsController.push({ ip, requests: 1, created_at: new Date() })
  }

  function verfiyIsValidPunishment(data){
    const punishmentDate = data.created_at.getTime()
    const currentDate = new Date().getTime()

    const differenceBetweenDates = currentDate - punishmentDate

    if(differenceBetweenDates > punishMs) {
      console.log('saiu do castigo')
      return removeIpPunish(data)
    }

    console.log('ainda em castigo')
    throw new Error()
  }

  function setNewPunishIP(data){
    const position = ipsController.indexOf(data)
    ipsController.splice(position, 1)

    ipsPunish.push({
        ip: data.ip,
        requests: 0,
        created_at: new Date()
    })
     
    throw new Error()
  }

  function removeIpPunish(data){
    const position = ipsPunish.indexOf(data)
    ipsPunish.splice(position, 1)
    return setNewIP(data.ip)
  }

  return (request, response, next) => {
    try {
      
      verifyIps(request.connection.remoteAddress)
      next()

    } catch (error) {
      next(error)
    }
  }

}

export default Object.freeze({
  injectRequestId,
  onNoMatchHandler,
  onErrorHandler,
  logRequest,
  rateLimit
});
