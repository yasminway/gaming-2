const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const RAWG_API_KEY = process.env.RAWG_API_KEY || "38a8f8bd32784df1850203ecee0a5f2e";

app.get("/games", async (req, res) => {
  try {
    const { search = "" } = req.query;
    const params = {
      key: RAWG_API_KEY,
      search,
      page_size: 1
    };

    const response = await axios.get("https://api.rawg.io/api/games", { params });
    res.json({
      message: "Deu certo!",
      headers: response.headers,
      status: response.status,
      result: response.data.results[0]
    });
  } catch (error) {
    console.error("Erro completo:", error.toJSON?.() || error.message);
    res.status(500).json({
      erro: "Erro RAWG",
      detalhe: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});