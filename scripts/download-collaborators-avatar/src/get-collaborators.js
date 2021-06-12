import get from "./utils/get";
import { AUTH_TOKEN } from "./credentials";

export default async function getCollaborators(collaboratorsUrl) {
  if (!collaboratorsUrl) {
    throw new Error("An error occurred while trying to fetch the repository");
  }
  return get(collaboratorsUrl, AUTH_TOKEN);
}
