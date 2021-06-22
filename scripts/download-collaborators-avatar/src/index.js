import getCollaborators from "./get-collaborators.js";
import generateCollaboratorsJson from "./generate-collaborators-json.js";
import downloadCollaboratorsAvatar from "./download-collaborators-avatar.js";

async function start() {
  const collaborators = await getCollaborators();
  await downloadCollaboratorsAvatar(collaborators);
  await generateCollaboratorsJson(collaborators);

  console.log(`\n> Total collaborators: ${collaborators.length}`);
}

start();
