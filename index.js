// index.js - versão protegida contra bloqueio da ferramenta no ChatGPT

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// --- Dicionários personalizados ---
const genres = {
  "horror": 2, "terror": 2, "rpg": 12, "jrpg": 12, "adventure": 31,
  "ação": 5, "action": 5, "simulation": 13, "simulação": 13,
  "platformer": 8, "plataforma": 8
};
const platforms = {
  "ps2": 7, "playstation 2": 7, "ps3": 9, "playstation 3": 9,
  "ps4": 48, "playstation 4": 48, "ps5": 167, "playstation 5": 167,
  "switch": 130, "nintendo switch": 130, "pc": 6, "xbox": 11,
  "xbox one": 49, "xbox series": 169
};
const themes = {
  "survival": 19, "mystery": 43, "psychological": 31, "psicológico": 31, "indie": 32
};
const keywords = {
  "female protagonist": 962, "survival horror": 1836, "camera": 1834,
  "ghosts": 16, "death": 558, "multiple endings": 1313, "exploration": 552,
  "bloody": 1273, "disease": 613, "detective": 1575, "revenge": 1058,
  "cult": 637, "darkness": 223, "boss fight": 3846, "hospital": 1031,
  "hallucination": 1383, "plot twist": 3300, "isolation": 5409, "gore": 101
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
  const m = text?.match(/\"(.*?)\"/) || text?.match(/s[ée]rie ([\w\s:]+)/i);
  return m ? m[1].trim() : null;
}
function toUnixTimestamp(dateStr) {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}
function buildFilter(field, values) {
  if (!values?.length) return null;
  if (values.length === 1) return `${field} = ${values[0]}`;
  return `${field} = (${values.join(',')})`;
}

// --- Token da IGDB ---
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

// --- Endpoint /games/ask ---
app.get('/games/ask', async (req, res) => {
  try {
    const pergunta = req.query.question || "";
    const { title, genreIds, platformIds, themeIds, keywordIds, year, limit = 30 } = parseGameQuery(pergunta);

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

    const igdbQueryArr = [];
    if (title) igdbQueryArr.push(`search "${title}";`);
    igdbQueryArr.push("fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name, keywords.name;");
    if (filters.length) igdbQueryArr.push(`where ${filters.join(" & ")};`);
    igdbQueryArr.push("sort first_release_date desc;");
    igdbQueryArr.push(`limit ${limit};`);

    const query = igdbQueryArr.join('\n');
    console.log("\n--- IGDB QUERY ---\n" + query + "\n------------------");

    const token = await getAccessToken();
    const { data } = await axios.post('https://api.igdb.com/v4/games', query, {
      headers: {
        'Client-ID': process.env.CLIENT_ID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'text/plain'
      }
    });

    return res.status(200).json({ fallback: false, results: data });
  } catch (err) {
    console.error("[IGDB ERRO]", err?.response?.data || err.message);
    // 🔒 Nunca mais envie fallback:true com erro — só resultado vazio mesmo
    return res.status(200).json({ fallback: false, results: [], message: 'Erro interno tratado.' });
  }
});

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

app.listen(port, () => {
  console.log('🎮 Proxy rodando em http://localhost:' + port);
});
