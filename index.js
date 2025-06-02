// index.js com reconsultas automáticas inteligentes

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Filtros customizáveis
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
const keywords = {
  "female protagonist": 962, "survival horror": 1836, "camera": 1834, "ghosts": 16,
  "death": 558, "multiple endings": 1313, "psychological horror": 31
};

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
  const m = text?.match(/["\u201c\u201d](.*?)["\u201c\u201d]/) || text?.match(/s[ée]rie ([\w\s:]+)/i);
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
    title, genreIds, platformIds, themeIds, keywordIds, year, limit: 30
  };
}

function buildFilter(field, values) {
  if (!values?.length) return null;
  return `${field} = (${values.join(',')})`;
}

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

async function queryIGDB(filters, title, limit) {
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
  return data;
}

app.get('/games/ask', async (req, res) => {
  try {
    const pergunta = req.query.question || "";
    const { title, genreIds, platformIds, themeIds, keywordIds, year, limit } = parseGameQuery(pergunta);

    const filtersFull = [];
    if (genreIds.length) filtersFull.push(buildFilter('genres', genreIds));
    if (platformIds.length) filtersFull.push(buildFilter('platforms', platformIds));
    if (themeIds.length) filtersFull.push(buildFilter('themes', themeIds));
    if (keywordIds.length) filtersFull.push(buildFilter('keywords', keywordIds));
    if (year) {
      filtersFull.push(`first_release_date >= ${toUnixTimestamp(`${year}-01-01`)}`);
      filtersFull.push(`first_release_date <= ${toUnixTimestamp(`${year}-12-31`)}`);
    }

    const attempts = [
      filtersFull,
      filtersFull.filter(f => !f?.startsWith('genres')),
      filtersFull.filter(f => !f?.startsWith('genres') && !f?.includes('first_release_date')),
      keywordIds.length ? [buildFilter('keywords', keywordIds)] : []
    ];

    for (const attempt of attempts) {
      const results = await queryIGDB(attempt.filter(Boolean), title, limit);
      if (results.length) return res.json({ fallback: false, results });
    }

    res.json({ fallback: true, results: [], message: 'Nenhum resultado encontrado mesmo com variações.' });
  } catch (err) {
    console.error("[IGDB ERROR]", err?.response?.data || err.message);
    res.status(500).json({ fallback: true, results: [], message: 'Erro na conexão com a IGDB.' });
  }
});

app.listen(port, () => {
  console.log('🎮 Proxy rodando em http://localhost:' + port);
});
