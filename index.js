
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";
import { gerarQueryIGDB } from "./gerador_query_igdb.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

function montarQueryIGDB({ genreId, themeId, platform, year, month, search, limit = 50 }) {
  let where = [];

  if (genreId) where.push(`genres = (${genreId})`);
  if (themeId) where.push(`themes = (${themeId})`);
  if (platform) where.push(`platforms = (${platform})`);
  if (year && !month) {
    const min = Math.floor(new Date(`${year}-01-01`).getTime() / 1000);
    const max = Math.floor(new Date(`${year}-12-31`).getTime() / 1000);
    where.push(`first_release_date >= ${min} & first_release_date <= ${max}`);
  }
  if (month && year) {
    const min = Math.floor(new Date(`${year}-${month}-01`).getTime() / 1000);
    const max = Math.floor(new Date(`${year}-${month}-31`).getTime() / 1000);
    where.push(`first_release_date >= ${min} & first_release_date <= ${max}`);
  }

  let body = "";
  if (search) body += `search "${search}";\n`;

  body += "fields name, summary, genres.name, platforms.name, first_release_date, cover.url, rating;\n";
  if (where.length) body += `where ${where.join(" & ")};\n`;
  body += `limit ${limit};`;

  return body;
}

app.post("/games", async (req, res) => {
  const { pergunta } = req.body;
  if (!pergunta) return res.status(400).json({ erro: "Pergunta ausente." });

  const filtros = gerarQueryIGDB(pergunta);

  try {
    const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": process.env.CLIENT_ID,
        Authorization: `Bearer ${process.env.IGDB_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: montarQueryIGDB(filtros)
    });

    const data = await igdbResponse.json();
    res.json(data);
  } catch (erro) {
    res.status(500).json({ erro: "Erro IGDB", detalhe: erro });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Servidor rodando na porta " + port));
