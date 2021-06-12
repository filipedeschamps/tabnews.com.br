// https://api.github.com/repos/user/repor/collaborators/{collaborator}}"
export default function clearCollaboratorsUrl(repo) {
  if (!repo) {
    throw new Error("An error occurred while trying to fetch collaborators");
  }

  return repo.collaborators_url.split("{")[0];
}
