const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

let accessToken = null;
let tokenExpiration = 0;

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

async function refreshToken() {
  try {
    const res = await axios.post("https://id.twitch.tv/oauth2/token", null, {
      params: {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials",
      },
    });

    accessToken = res.data.access_token;
    tokenExpiration = Date.now() + res.data.expires_in * 1000;
    console.log("Novo token IGDB obtido");
  } catch (error) {
    console.error("Erro ao renovar o token:", error.message);
  }
}

async function ensureTokenValid() {
  if (!accessToken || Date.now() > tokenExpiration) {
    await refreshToken();
  }
}

app.get("/games", async (req, res) => {
  const { search = "" } = req.query;
  await ensureTokenValid();

  try {
    const response = await axios.post(
      "https://api.igdb.com/v4/games",
      `search "${search}"; fields name, summary, genres.name, platforms.name, first_release_date, cover.url; limit 5;`,
      {
        headers: {
          "Client-ID": CLIENT_ID,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("Erro na requisição IGDB:", error.message);
    res.status(500).json({ error: "Erro ao buscar jogos no IGDB" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy IGDB rodando na porta ${PORT}`);
});