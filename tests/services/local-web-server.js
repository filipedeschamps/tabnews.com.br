import waitOn from "wait-on";
import killPort from "kill-port";
import childProcess from "child_process";
const spawn = childProcess.spawn;

const localWebServerUrl = "http://localhost";
const localWebServerPort = 8080;
const localWebServerAddress = `${localWebServerUrl}:${localWebServerPort}`;

export default function localWebServerFactory() {
  let localServerProcess;

  async function startLocalServer() {
    await forceKillServerPort();
    await startBuild();
    return await startNextServer();
  }

  async function forceKillServerPort() {
    await killPort(localWebServerPort);
  }

  function startBuild() {
    return new Promise((resolve, reject) => {
      const buildProcess = spawn("npm", ["run", "build"]);

      buildProcess.on("close", (exitCode) => {
        if (exitCode === 0) {
          return resolve();
        }
        return reject(exitCode);
      });
    });
  }

  function startNextServer() {
    return new Promise((resolve, reject) => {
      const nextProcess = spawn("npm", ["run", "start"]);

      nextProcess.stdout.on("data", (data) => {
        if (data.toString().includes("started server on")) {
          return resolve(nextProcess);
        }
      });
    });
  }

  async function start() {
    const resourceToCheckAvailability = localWebServerAddress;

    localServerProcess = await startLocalServer();

    return waitOn({
      resources: [resourceToCheckAvailability],
    });
  }

  async function stop() {
    return new Promise((resolve, reject) => {
      localServerProcess.kill();
      localServerProcess.on("close", (exitCode) => {
        if (exitCode === 0) {
          return resolve();
        }
        return reject(exitCode);
      });
    });
  }

  return {
    start,
    stop,
    url: localWebServerAddress,
  };
}
