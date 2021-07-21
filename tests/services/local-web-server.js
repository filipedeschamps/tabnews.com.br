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
  }

  async function stop() {
    await forceKillServerPort();
  }

  return {
    start,
    stop,
    url: localWebServerAddress,
  };
}
