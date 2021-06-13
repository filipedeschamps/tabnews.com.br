// https://api.github.com/repos/user/repor/collaborators/{collaborator}}"
export default function getCollaboratorsUrl(repo) {
  if (!repo || !repo.collaborators_url) {
    throw new Error("An error occurred while trying to fetch collaborators" + JSON.stringify(repo));
  }
  return repo.collaborators_url.split("{")[0];
}
