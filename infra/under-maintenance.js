import logger from 'infra/logger';
import webserver from 'infra/webserver';

let underMaintenance;

try {
  underMaintenance = JSON.parse(process.env.UNDER_MAINTENANCE || '{}');
} catch (error) {
  if (webserver.isBuildTime) {
    logger.error('Error parsing UNDER_MAINTENANCE', { error });
  }
  underMaintenance = {};
}

const methodsAndPaths = underMaintenance.methodsAndPaths || [];
const message = underMaintenance.message || 'Funcionalidade em manutenção.';
const action = underMaintenance.action || 'Tente novamente mais tarde.';
const statusCode = underMaintenance.statusCode || 503;

function check(request) {
  if (methodsAndPaths.length === 0) return;

  const method = request.method;
  const path = request.nextUrl.pathname;

  const isUnderMaintenance = methodsAndPaths.some((methodAndPath) =>
    new RegExp(methodAndPath).test(`${method} ${path}`),
  );

  if (isUnderMaintenance) {
    return {
      status: statusCode,
      body: JSON.stringify({
        message,
        action,
        error_location_code: 'INFRA:UNDER_MAINTENANCE:CHECK:IS_UNDER_MAINTENANCE',
      }),
    };
  }
}

export default Object.freeze({
  check,
});
