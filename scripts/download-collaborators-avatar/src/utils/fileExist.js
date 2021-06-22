const fs = require("fs");

export default function fileExist(path) {
  return path ? fs.existsSync(path) : false;
}
