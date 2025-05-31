const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const RAWG_API_KEY = process.env.RAWG_API_KEY;

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
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Erro ao buscar dados da RAWG." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});