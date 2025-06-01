import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import keywords from './keywords.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Gêneros, plataformas e temas
const genres = {
  "terror": 2, "horror": 2, "rpg": 12, "jrpg": 12, "aventura": 31, "adventure": 31,
  "ação": 5, "action": 5, "simulação": 13, "simulation": 13, "plataforma": 8, "platformer": 8
};
const platforms = {
  "ps2": 7, "playstation 2": 7, "ps3": 9, "playstation 3": 9,
  "ps4": 48, "playstation 4": 48, "ps5": 167, "playstation 5": 167,
  "switch": 130, "nintendo switch": 130,
  "pc": 6, "xbox": 11, "xbox one": 49, "xbox series": 169
};
const themes = {
  "low poly": 20, "experimental": 20, "survival": 19, "mystery": 43,
  "psicológico": 31, "psychological": 31, "indie": 32
};

function extractGameTitle(question) {
  let m = question.match(/["“”](.*?)["“”]/);
  if (m) return m[1];
  m = question.match(/s[ée]rie ([\w\s:'\-]+)/i);
  if (m) return m[1].trim();
  // Lista de franquias famosas (pode ampliar!)
  const knownFranchises = [
    'Fatal Frame','Silent Hill','Persona','Final Fantasy','Resident Evil','Dragon Quest',
    'Monster Hunter','Pokémon','Fire Emblem','Zelda','Mario','Bloodborne','Atelier','Yakuza'
  ];
  for (let f of knownFranchises) {
    if (question.toLowerCase().includes(f.toLowerCase())) return f;
  }
  return null;
}

function extractYear(text) {
  const match = text.match(/20\d{2}/);
  return match ? parseInt(match[0]) : undefined;
}
function extractGenres(text) {
  return Object.keys(genres).filter(g => text.toLowerCase().includes(g)).map(g => genres[g]);
}
function extractPlatforms(text) {
  return Object.keys(platforms).filter(p => text.toLowerCase().includes(p)).map(p => platforms[p]);
}
function extractThemes(text) {
  return Object.keys(themes).filter(t => text.toLowerCase().includes(t)).map(t => themes[t]);
}
function extractProtagonist(text) {
  const re = /protagonista feminina|female protagonist|mulher|girl|garota|woman/i;
  return re.test(text);
}
function extractKeywords(text) {
  return Object.keys(keywords).filter(k => text.toLowerCase().includes(k)).map(k => keywords[k]);
}

function parseGameQuery(question) {
  let searchParts = [];
  const title = extractGameTitle(question);
  if (title) searchParts.push(title);
  if (extractProtagonist(question)) searchParts.push("female protagonist");
  const genreIds = extractGenres(question);
  const platformIds = extractPlatforms(question);
  const themeIds = extractThemes(question);
  const keywordIds = extractKeywords(question);
  const year = extractYear(question);

  return {
    search: searchParts.length ? searchParts.join(" ") : "",
    genreId: genreIds.length ? genreIds[0] : undefined,
    platformId: platformIds.length ? platformIds[0] : undefined,
    themeId: themeIds.length ? themeIds[0] : undefined,
    keywordIds: keywordIds.length ? keywordIds : undefined,
    year: year,
    limit: 30
  };
}

// Token da Twitch/IGDB
let accessToken = '';
let tokenExpiration = 0;
async function getAccessToken() {
  if (Date.now() < tokenExpiration) return accessToken;
  const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'client_credentials'
    }
  });
  accessToken = response.data.access_token;
  tokenExpiration = Date.now() + response.data.expires_in * 1000;
  return accessToken;
}

// Rota inteligente para perguntas livres
app.get('/games/ask', async (req, res) => {
  try {
    const pergunta = req.query.question || "";
    const { search, genreId, platformId, themeId, keywordIds, year, limit } = parseGameQuery(pergunta);
    let filters = [];
    if (genreId) filters.push(`genres = (${genreId})`);
    if (themeId) filters.push(`themes = (${themeId})`);
    if (platformId) filters.push(`platforms = (${platformId})`);
    if (keywordIds && keywordIds.length) filters.push(`keywords = (${keywordIds.join(",")})`);
    if (year) filters.push(`first_release_date >= ${year}-01-01 & first_release_date <= ${year}-12-31`);
    const igdbQuery = `
      ${search ? `search "${search}";` : ""}
      fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name, keywords.name;
      ${filters.length > 0 ? `where ${filters.join(' & ')};` : ""}
      limit ${limit};
    `;
    const token = await getAccessToken();
    const igdbResponse = await axios.post(
      'https://api.igdb.com/v4/games',
      igdbQuery,
      {
        headers: {
          'Client-ID': process.env.CLIENT_ID,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      }
    );
    res.json({ fallback: false, results: igdbResponse.data });
  } catch (error) {
    console.error(error.message);
    res.json({ fallback: true, results: [], message: 'Erro na conexão com a IGDB.' });
  }
});

// Rota manual
app.get('/games', async (req, res) => {
  try {
    const token = await getAccessToken();
    const query = req.query.search || '';
    const genreId = req.query.genreId;
    const themeId = req.query.themeId;
    const platformId = req.query.platformId;
    const year = req.query.year;
    const keywordIds = req.query.keywordIds ? req.query.keywordIds.split(',') : [];
    const limit = req.query.limit || 30;
    let filters = [];
    if (genreId) filters.push(`genres = (${genreId})`);
    if (themeId) filters.push(`themes = (${themeId})`);
    if (platformId) filters.push(`platforms = (${platformId})`);
    if (keywordIds.length) filters.push(`keywords = (${keywordIds.join(",")})`);
    if (year) filters.push(`first_release_date >= ${year}-01-01 & first_release_date <= ${year}-12-31`);
    const igdbQuery = `
      search "${query}";
      fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name, keywords.name;
      ${filters.length > 0 ? `where ${filters.join(' & ')};` : ""}
      limit ${limit};
    `;
    const igdbResponse = await axios.post(
      'https://api.igdb.com/v4/games',
      igdbQuery,
      {
        headers: {
          'Client-ID': process.env.CLIENT_ID,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        }
      }
    );
    res.json({ fallback: false, results: igdbResponse.data });
  } catch (error) {
    console.error(error.message);
    res.json({ fallback: true, results: [], message: 'Erro na conexão com a IGDB.' });
  }
});

app.listen(port, () => {
  console.log(`🎮 IGDB Proxy rodando em http://localhost:${port}`);
});
