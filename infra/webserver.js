function isLambdaServer() {
  return !!process.env.VERCEL_ENV;
}

function isBuildTime() {
  return !!process.env.BUILD_TIME;
}

function getHost() {
  let webserverHost = 'https://www.tabnews.com.br';

  if (!isLambdaServer()) {
    webserverHost = `http://${process.env.WEBSERVER_HOST}:${process.env.WEBSERVER_PORT}`;
  }

  if (['preview'].includes(process.env.VERCEL_ENV)) {
    webserverHost = `https://${process.env.VERCEL_URL}`;
  }

  return webserverHost;
}

export default Object.freeze({
  getHost,
  isBuildTime,
  isLambdaServer,
});
