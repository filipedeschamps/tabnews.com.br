const download = require("image-downloader");
const path = require("path");
const fs = require("fs");
import fileExist from "./utils/fileExist";

export default async function downloadCollaboratorsAvatar(collaborators = []) {
  const DEST_PATH = path.resolve(__dirname, "contents");

  if (!fileExist(DEST_PATH)) {
    await fs.promises.mkdir(DEST_PATH);
  }

  for (let { login, avatar_url } of collaborators) {
    const dest = `${DEST_PATH}/${login}.jpg`;
    if (fileExist(dest)) {
      console.log(`"${login}" avatar already exists`);
      continue;
    }

    try {
      await download.image({
        url: avatar_url,
        dest,
      });
      console.log(`${login} avatar successfully downloaded!`);
    } catch (error) {
      console.error(
        `There was an error trying to download the avatar from ${login}.`,
        err
      );
    }
  }
}
