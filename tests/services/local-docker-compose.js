import waitOn from "wait-on";
import childProcess from "child_process";
const spawn = childProcess.spawn;

export default function localDockerComposeFactory() {
  let localDockerComposeProcess;

  function startLocalDockerCompose() {
    return new Promise((resolve, reject) => {
      const dockerComposeProcess = spawn("docker-compose", [
        "-f",
        "docker-compose.test.yml",
        "up",
        "--force-recreate",
        "--renew-anon-volume",
      ]);

      dockerComposeProcess.stdout.on("data", (data) => {
        return resolve(dockerComposeProcess);
      });
    });
  }

  async function start() {
    const resourceToCheckAvailability = "tcp:localhost:54321";

    localDockerComposeProcess = await startLocalDockerCompose();

    return waitOn({
      resources: [resourceToCheckAvailability],
    });
  }

  async function stop() {
    return new Promise((resolve, reject) => {
      localDockerComposeProcess.kill();
      localDockerComposeProcess.on("close", (exitCode) => {
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
  };
}
