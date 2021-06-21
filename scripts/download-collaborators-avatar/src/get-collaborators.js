import { Octokit } from "octokit";

const octokit = new Octokit({
  auth: process.env.AUTH_TOKEN,
});

export default async function getCollaborators() {
  const collaborators = await octokit.paginate(
    "GET /repos/{owner}/{repo}/collaborators",
    {
      owner: "filipedeschamps",
      repo: "tabnews.com.br",
    }
  );

  return collaborators;
}
