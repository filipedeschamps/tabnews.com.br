import localDockerComposeFactory from "tests/services/local-docker-compose.js";
import localWebServerFactory from "tests/services/local-web-server.js";

export default function localServicesFactory() {
  const localDockerCompose = localDockerComposeFactory();
  const localWebServer = localWebServerFactory();

  async function start() {
    await localDockerCompose.start();
    await localWebServer.start();
  }

  async function stop() {
    await localWebServer.stop();
    await localDockerCompose.stop();
  }

  return {
    start,
    stop,
    localWebServer,
    localDockerCompose,
  };
}
