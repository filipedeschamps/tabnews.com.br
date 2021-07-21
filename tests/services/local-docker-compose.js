import killTree from "tree-kill";
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
  }

  async function stop() {
    killTree(localDockerComposeProcess.pid);
  }

  return {
    start,
    stop,
  };
}
