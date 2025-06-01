// index.js

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- Filtros customizáveis ---
const genres = {
  "horror": 2, "terror": 2, "rpg": 12, "jrpg": 12, "adventure": 31, "aventura": 31,
  "action": 5, "ação": 5, "simulation": 13, "simulação": 13, "platformer": 8, "plataforma": 8
};
const platforms = {
  "ps2": 7, "playstation 2": 7, "ps3": 9, "playstation 3": 9, "ps4": 48, "playstation 4": 48,
  "ps5": 167, "playstation 5": 167, "switch": 130, "nintendo switch": 130,
  "pc": 6, "xbox": 11, "xbox one": 49, "xbox series": 169
};
const themes = {
  "survival": 19, "mystery": 43, "psychological": 31, "psicológico": 31, "indie": 32
};
// Pode colar keywords expandidas aqui!
const keywords = {
  "female protagonist": 962, "survival horror": 1836, "camera": 1834, "ghosts": 16,
  "death": 558, "multiple endings": 1313, "exploration": 552, "bloody": 1273, "disease": 613,
  "detective": 1575, "revenge": 1058, "cult": 637, "darkness": 223, "boss fight": 3846,
  "single-player only": 2047, "scary children": 3192, "hallucination": 1383, "plot twist": 3300,
  "evil organization": 302, "hospital": 1031, "gore": 101, "isolation": 5409, "mad scientist": 348
  // ...pode adicionar mais!
};

// --- Funções auxiliares ---
function extract(text, dict) {
  if (!text) return [];
  const norm = text.toLowerCase();
  return Object.keys(dict).filter(k => norm.includes(k)).map(k => dict[k]);
}
function extractYear(text) {
  const m = text?.match(/20\d{2}/);
  return m ? parseInt(m[0]) : undefined;
}
function extractTitle(text) {
  const m = text?.match(/["“”](.*?)["“”]/) || text?.match(/s[ée]rie ([\w\s:]+)/i);
  return m ? m[1].trim() : null;
}
function toUnixTimestamp(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}

function parseGameQuery(question) {
  const genreIds = extract(question, genres);
  const platformIds = extract(question, platforms);
  const themeIds = extract(question, themes);
  const keywordIds = extract(question, keywords);
  const year = extractYear(question);
  const title = extractTitle(question);

  return {
    title,
    genreIds,
    platformIds,
    themeIds,
    keywordIds,
    year,
    limit: 30
  };
}

// --- IGDB Auth ---
let accessToken = '';
let tokenExpiration = 0;
async function getAccessToken() {
  if (Date.now() < tokenExpiration && accessToken) return accessToken;
  const { data } = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'client_credentials'
    }
  });
  accessToken = data.access_token;
  tokenExpiration = Date.now() + data.expires_in * 1000;
  return accessToken;
}

// --- Helper de WHERE (regra IGDB: sempre "&"!) ---
function buildFilter(field, values) {
  if (!values?.length) return null;
  if (values.length === 1) return `${field} = ${values[0]}`;
  return `${field} = (${values.join(',')})`;
}

// --- Endpoint principal ---
app.get('/games/ask', async (req, res) => {
  try {
    const pergunta = req.query.question || "";
    const { title, genreIds, platformIds, themeIds, keywordIds, year, limit } = parseGameQuery(pergunta);

    // Montagem dos filtros para o WHERE
    const filters = [];
    const genreFilter = buildFilter('genres', genreIds);
    const platformFilter = buildFilter('platforms', platformIds);
    const themeFilter = buildFilter('themes', themeIds);
    const keywordFilter = buildFilter('keywords', keywordIds);

    if (genreFilter) filters.push(genreFilter);
    if (platformFilter) filters.push(platformFilter);
    if (themeFilter) filters.push(themeFilter);
    if (keywordFilter) filters.push(keywordFilter);

    if (year) {
      const start = toUnixTimestamp(`${year}-01-01`);
      const end = toUnixTimestamp(`${year}-12-31`);
      filters.push(`first_release_date >= ${start}`);
      filters.push(`first_release_date <= ${end}`);
    }

    // Monta a query IGDB
    const igdbQueryArr = [];
    // Só faz search se for relevante (nome/título)
    if (title) igdbQueryArr.push(`search "${title}";`);
    igdbQueryArr.push("fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name, keywords.name;");
    if (filters.length) igdbQueryArr.push(`where ${filters.join(" & ")};`);
    igdbQueryArr.push("sort first_release_date desc;");
    igdbQueryArr.push(`limit ${limit};`);
    const query = igdbQueryArr.join('\n');

    console.log("\n--- IGDB QUERY ---\n" + query + "\n------------------");

    // IGDB Request
    const token = await getAccessToken();
    const { data } = await axios.post('https://api.igdb.com/v4/games', query, {
      headers: {
        'Client-ID': process.env.CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      }
    });

    res.json({ fallback: false, results: data });
  } catch (error) {
    console.error("[IGDB ERROR]", error?.response?.data || error.message);
    res.status(500).json({ fallback: true, results: [], message: 'Erro na conexão com a IGDB.' });
  }
});

// --- Server start ---
app.listen(port, () => {
  console.log('🎮 Proxy rodando em http://localhost:' + port);
});
