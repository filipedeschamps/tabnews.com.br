const fs = require('fs');

export default function getNumberOfFilesInFolder(path) {
  return fs.readdirSync(path).length;
}
