import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

function parseGameQuery(question) {
  let searchParts = [];
  if (extractProtagonist(question)) searchParts.push("female protagonist");
  const genreIds = extractGenres(question);
  const platformIds = extractPlatforms(question);
  const themeIds = extractThemes(question);
  const year = extractYear(question);

  return {
    search: searchParts.join(" "),
    genreId: genreIds.length ? genreIds[0] : undefined,
    platformId: platformIds.length ? platformIds[0] : undefined,
    themeId: themeIds.length ? themeIds[0] : undefined,
    year: year,
    limit: 30
  };
}

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

// Rota inteligente
app.get('/games/ask', async (req, res) => {
  try {
    const pergunta = req.query.question || "";
    const { search, genreId, platformId, themeId, year, limit } = parseGameQuery(pergunta);
    let filters = [];
    if (genreId) filters.push(`genres = (${genreId})`);
    if (themeId) filters.push(`themes = (${themeId})`);
    if (platformId) filters.push(`platforms = (${platformId})`);
    if (year) filters.push(`first_release_date >= ${year}-01-01 & first_release_date <= ${year}-12-31`);

    const igdbQuery = `
      ${search ? `search "${search}";` : ""}
      fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name;
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
    const limit = req.query.limit || 30;

    let filters = [];
    if (genreId) filters.push(`genres = (${genreId})`);
    if (themeId) filters.push(`themes = (${themeId})`);
    if (platformId) filters.push(`platforms = (${platformId})`);
    if (year) filters.push(`first_release_date >= ${year}-01-01 & first_release_date <= ${year}-12-31`);

    const igdbQuery = `
      search "${query}";
      fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name;
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
