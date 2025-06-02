import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Filtros customizados
const genres = {
  "horror": 2, "terror": 2, "rpg": 12, "jrpg": 12, "adventure": 31,
  "ação": 5, "action": 5, "simulação": 13, "simulation": 13, "plataforma": 8, "platformer": 8
};
const platforms = {
  "ps2": 7, "ps3": 9, "ps4": 48, "ps5": 167, "switch": 130, "pc": 6,
  "xbox": 11, "xbox one": 49, "xbox series": 169
};
const themes = {
  "survival": 19, "psychological": 31, "indie": 32, "mystery": 43
};
const keywords = {
  "female protagonist": 962, "survival horror": 1836, "camera": 1834,
  "ghosts": 16, "death": 558, "multiple endings": 1313, "cult": 637,
  "hallucination": 1383, "darkness": 223, "boss fight": 3846,
  "hospital": 1031, "mad scientist": 348
};
const franchises = ["fatal frame", "final fantasy", "persona", "resident evil", "silent hill"];

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
function isAnnouncedOnly(text) {
  return /sem data|sem previsão|anunciado/i.test(text);
}
function isFranchiseQuery(text) {
  return franchises.find(f => text.toLowerCase().includes(f));
}

function parseGameQuery(question) {
  const genreIds = extract(question, genres);
  const platformIds = extract(question, platforms);
  const themeIds = extract(question, themes);
  const keywordIds = extract(question, keywords);
  const year = extractYear(question);
  const title = extractTitle(question);
  const announcedOnly = isAnnouncedOnly(question);
  const franchise = isFranchiseQuery(question);

  return {
    title,
    genreIds,
    platformIds,
    themeIds,
    keywordIds,
    year,
    franchise,
    announcedOnly,
    limit: 30
  };
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

function buildFilter(field, values) {
  if (!values?.length) return null;
  if (values.length === 1) return `${field} = ${values[0]}`;
  return `${field} = (${values.join(',')})`;
}

app.get('/games/ask', async (req, res) => {
  try {
    const pergunta = req.query.question || "";
    const {
      title, genreIds, platformIds, themeIds,
      keywordIds, year, limit, announcedOnly, franchise
    } = parseGameQuery(pergunta);

    const filters = [];
    if (buildFilter('genres', genreIds)) filters.push(buildFilter('genres', genreIds));
    if (buildFilter('platforms', platformIds)) filters.push(buildFilter('platforms', platformIds));
    if (buildFilter('themes', themeIds)) filters.push(buildFilter('themes', themeIds));
    if (buildFilter('keywords', keywordIds)) filters.push(buildFilter('keywords', keywordIds));

    if (franchise) filters.push(`franchise.name ~ *"${franchise}"*`);

    if (year && !announcedOnly) {
      const start = toUnixTimestamp(`${year}-01-01`);
      const end = toUnixTimestamp(`${year}-12-31`);
      filters.push(`first_release_date >= ${start}`);
      filters.push(`first_release_date <= ${end}`);
    }

    if (announcedOnly) {
      filters.push("first_release_date = null");
    }

    const igdbQueryArr = [];
    if (title) igdbQueryArr.push(`search "${title}";`);
    igdbQueryArr.push("fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name, keywords.name, franchise.name;");
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

    if (!data || data.length === 0) {
      return res.json({ fallback: true, results: [], message: 'Sem resultados diretos na IGDB, tentei interpretar o melhor possível!' });
    }

    res.json({ fallback: false, results: data });
  } catch (error) {
    console.error("[IGDB ERROR]", error?.response?.data || error.message);
    res.status(500).json({ fallback: true, results: [], message: 'Erro na conexão com a IGDB.' });
  }
});

app.listen(port, () => {
  console.log('🎮 Proxy rodando em http://localhost:' + port);
});
