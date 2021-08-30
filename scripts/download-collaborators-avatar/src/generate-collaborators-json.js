const fs = require('fs');

export default function generateCollboratorsJson(collaborators) {
  const collaboratorsLogin = collaborators.map((collaborator) => {
    return collaborator.login;
  });

  fs.writeFileSync('./src/contents/collaborators.json', JSON.stringify(collaboratorsLogin));
}
