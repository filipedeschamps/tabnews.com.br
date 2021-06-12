const fetch = require("node-fetch");

export default async function get(url, authToken = "") {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    return response.json();
  } catch (error) {
    console.error(error);
    throw new Error("Erro ao busca dados do repositorio");
  }
}
