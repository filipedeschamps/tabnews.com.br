import getRepoInfo from "./get-repo-infos";
import getCollaborators from "./get-collaborators";
import getCollaboratorsUrl from "./clear-collaborators-url";
import downloadCollaboratorsAvatar from "./download-collaborators-avatar";

(function () {
  return Promise.resolve({
    user: "filipedeschamps",
    repo: "tabnews.com.br",
  })
    .then(getRepoInfo)
    .then(getCollaboratorsUrl)
    .then(getCollaborators)
    .then(downloadCollaboratorsAvatar)
    .catch((e) => console.error(e));
})();
