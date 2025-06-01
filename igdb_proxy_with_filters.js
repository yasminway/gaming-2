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

const buildQuery = (pergunta) => {
  const cleanSearch = pergunta
    .toLowerCase()
    .replace(/\b(quais|são|os|jogos|com|protagonista|feminina|masculino|estão|previstos|pra|em|de|para|que|vão|ser|lançar|lançados)\b/gi, "")
    .trim();

  const query = `
    search "${cleanSearch}";
    fields name, summary, genres.name, platforms.name, rating, cover.url, first_release_date;
    sort first_release_date desc;
    limit 20;
  `;

  return query;
};

app.post("/games", async (req, res) => {
  try {
    const { pergunta } = req.body;
    const token = await getAccessToken();
    const clientId = process.env.CLIENT_ID;

    const query = buildQuery(pergunta);

    console.log("🟡 IGDB Query enviada:");
    console.log(query);

    const response = await axios.post(IGDB_URL, query, {
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${token}`,
        "Content-Type": "text/plain",
      },
    });

    console.log("🟢 Resposta IGDB:");
    console.dir(response.data, { depth: null });

    return res.json({
      fallback: !response.data || response.data.length === 0,
      results: response.data || [],
      message: (!response.data || response.data.length === 0)
        ? "Nenhum jogo encontrado com esse search."
        : undefined,
    });

  } catch (err) {
    console.error("🔴 Erro ao consultar a IGDB:", err.message);
    return res.json({
      fallback: true,
      results: [],
      message: "Erro na conexão com a IGDB.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor IGDB rodando na porta ${PORT}`);
});
