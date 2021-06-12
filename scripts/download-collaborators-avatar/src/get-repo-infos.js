import get from "./utils/get";
import { API_URL, AUTH_TOKEN } from "./credentials";

export default async function getRepoInfos({ user = "", repo = "" }) {
  const url = `${API_URL}/repos/${user}/${repo}`;
  return get(url, AUTH_TOKEN);
}
