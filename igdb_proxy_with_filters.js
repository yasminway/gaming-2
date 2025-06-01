const express = require("express");
const axios = require("axios");
const app = express();
const cors = require("cors");
require("dotenv").config();

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
    filters.push(`first_release_date >= ${Math.floor(new Date(start) / 1000)}`);
    filters.push(`first_release_date <= ${Math.floor(new Date(end) / 1000)}`);
  }

  if (params.genreId) filters.push(`genres = (${params.genreId})`);
  if (params.platform) filters.push(`platforms = (${params.platform})`);
  if (params.themeId) filters.push(`themes = (${params.themeId})`);

  let searchLine = params.search ? `search "${params.search}";` : "";

  return `
    ${searchLine}
    fields name,summary,genres.name,platforms.name,rating,cover.url,first_release_date;
    ${filters.length > 0 ? `where ${filters.join(" & ")};` : ""}
    limit ${params.limit || 10};
    sort first_release_date desc;
  `;
};

app.post("/games", async (req, res) => {
  try {
    const { pergunta } = req.body;
    const token = await getAccessToken();
    const clientId = process.env.CLIENT_ID;

    const queryParams = {
      limit: 50,
    };

    const lowerQuestion = pergunta.toLowerCase();

    if (lowerQuestion.includes("terror")) queryParams.genreId = 2;
    if (lowerQuestion.includes("jrpg")) queryParams.genreId = 18;
    if (lowerQuestion.includes("ação")) queryParams.genreId = 4;
    if (lowerQuestion.includes("tático")) queryParams.genreId = 24;

    if (lowerQuestion.includes("protagonista feminina")) queryParams.themeId = 41;
    if (lowerQuestion.includes("low poly") || lowerQuestion.includes("retrô")) queryParams.themeId = 20;
    if (lowerQuestion.includes("melancólico") || lowerQuestion.includes("melancolia")) queryParams.themeId = 41;

    const anoMatch = lowerQuestion.match(/\b(202[4-6])\b/);
    if (anoMatch) queryParams.year = anoMatch[1];

    const query = buildQuery(queryParams);

    const response = await axios.post(IGDB_URL, query, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
    });

    const jogos = response.data;

    if (!jogos || jogos.length === 0) {
      return res.json({
        fallback: true,
        results: [],
        message: "Nenhum jogo encontrado com esses filtros — quer que eu tente com critérios mais amplos ou busque na web?",
      });
    }

    return res.json({
      fallback: false,
      results: jogos,
    });

  } catch (err) {
    console.error("Erro ao consultar IGDB:", err);
    return res.status(500).json({
      erro: "Erro IGDB",
      detalhe: err.message || "Erro desconhecido",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
