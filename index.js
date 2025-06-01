const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// Fallback direto se a env não for lida
const RAWG_API_KEY = process.env.RAWG_API_KEY || "38a8f8bd32784df1850203ecee0a5f2e";

app.get("/games", async (req, res) => {
  try {
    const { search, genres, tags, dates } = req.query;
    const params = {
      key: RAWG_API_KEY,
      search,
      genres,
      tags,
      dates,
      page_size: 10
    };

    const response = await axios.get("https://api.rawg.io/api/games", { params });
    res.json(response.data);
  } catch (error) {
    console.error("Erro na requisição para RAWG:", error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao buscar dados da RAWG." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});