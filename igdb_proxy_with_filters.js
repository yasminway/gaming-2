const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const IGDB_URL = "https://api.igdb.com/v4/games";

const getAccessToken = async () => {
  return process.env.IGDB_TOKEN;
};

const buildQuery = (params) => {
  let filters = [];

  if (params.year) {
    const start = `${params.year}-01-01`;
    const end = `${params.year}-12-31`;
    filters.push(`first_release_date >= ${Math.floor(new Date(start).getTime() / 1000)}`);
    filters.push(`first_release_date <= ${Math.floor(new Date(end).getTime() / 1000)}`);
  }

  if (params.genreId) filters.push(`genres = (${params.genreId})`);
  if (params.platform) filters.push(`platforms = (${params.platform})`);

  let searchLine = params.search ? `search "${params.search}";` : "";

  return `
    ${searchLine}
    fields name, summary, genres.name, platforms.name, rating, cover.url, first_release_date;
    ${filters.length > 0 ? `where ${filters.join(" & ")};` : ""}
    sort first_release_date desc;
    limit ${params.limit || 10};
  `;
};

app.post("/games", async (req, res) => {
  try {
    const { pergunta } = req.body;
    const token = await getAccessToken();
    const clientId = process.env.CLIENT_ID;

    const queryParams = { limit: 50 };
    const lower = pergunta.toLowerCase();

    // Gêneros mais comuns
    if (lower.includes("terror")) queryParams.genreId = 2;
    if (lower.includes("jrpg")) queryParams.genreId = 18;
    if (lower.includes("ação")) queryParams.genreId = 4;
    if (lower.includes("tático")) queryParams.genreId = 24;

    // Ano (ex: 2025)
    const yearMatch = lower.match(/\b(202[4-6])\b/);
    if (yearMatch) queryParams.year = yearMatch[1];

    // Limpa palavras comuns pra focar na essência da busca
    queryParams.search = pergunta
      .replace(/\b(quais|são|os|jogos|com|protagonista|feminina|estão|previstos|pra|em|de|para|que|vão|ser|lançar|lançados)\b/gi, "")
      .trim();

    const query = buildQuery(queryParams);

    const response = await axios.post(IGDB_URL, query, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
    });

    const jogos = response.data;

    return res.json({
      fallback: !jogos || jogos.length === 0,
      results: jogos || [],
      message: (!jogos || jogos.length === 0)
        ? "Nenhum jogo encontrado com esses filtros"
        : undefined,
    });

  } catch (err) {
    console.error("Erro na API IGDB:", err.message);
    return res.json({
      fallback: true,
      results: [],
      message: "Erro na API IGDB — resposta vazia ou inválida 💔",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
