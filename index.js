import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// GENRES, PLATFORMS, THEMES
const genres = {
  "terror": 2, "horror": 2, "rpg": 12, "jrpg": 12, "aventura": 31, "adventure": 31,
  "ação": 5, "action": 5, "simulação": 13, "simulation": 13, "plataforma": 8, "platformer": 8
};
const platforms = {
  "ps2": 7, "playstation 2": 7, "ps3": 9, "playstation 3": 9, "ps4": 48, "playstation 4": 48, "ps5": 167, "playstation 5": 167,
  "switch": 130, "nintendo switch": 130, "pc": 6, "xbox": 11, "xbox one": 49, "xbox series": 169
};
const themes = {
  "low poly": 20, "experimental": 20, "survival": 19, "mystery": 43, "psicológico": 31, "psychological": 31, "indie": 32
};

// Cole o SEU bloco de keywords aqui!
const keywords = {
  "ghosts": 16, "exploration": 552, "bloody": 1273, "disease": 613, "detective": 1575, "murder": 278, "death": 558, "female protagonist": 962, "action-adventure": 269,
  "religion": 146, "parallel worlds": 435, "backtracking": 342, "multiple endings": 1313, "dialogue trees": 2726, "revenge": 1058, "camera": 1834, "survival horror": 1836,
  "sequel": 2236, "good vs evil": 2168, "bats": 1398, "cult": 637, "no jumping": 3528, "rituals": 360, "darkness": 223, "boss fight": 3846, "single-player only": 2047,
  "anthropomorphism": 1175, "playstation trophies": 1266, "alternate costumes": 4266, "ranking system": 3250, "polygonal 3d": 3745, "full motion video": 273,
  "white noise": 4325, "non-player character": 4378, "fake in-game advertising": 4432, "save point": 4653, "sprinting mechanics": 4647, "save file unlockables": 5459,
  "branching storyline": 540, "melee": 4635, "real-time combat": 347, "videotape": 2713, "infinite ammo": 4166, "difficulty level": 1087, "scary children": 3192,
  "female antagonist": 5175, "vending machine interaction": 4483, "rock music": 2318, "cheat code": 1228, "konami code": 1457, "no hud": 3443, "villain": 536,
  "been here before": 2307, "sadism": 5113, "tentacles": 2478, "nurse": 1603, "hallucination": 1383, "dimension travel": 305, "plot twist": 3300,
  "evil organization": 302, "stealth kill": 4555, "linear gameplay": 3157, "book adaptation": 4023, "ambient music": 1017, "new protagonist in sequel": 4150,
  "comic book cutscene": 4574, "new game plus": 4826, "satanism": 604, "innocent people die": 7185, "disc streaming": 750, "optional censorship": 2296, "shooting range": 1535,
  "reincarnation": 2872, "tragic hero": 8983, "plane shifting": 1826, "monsters that look suspiciously like genitalia": 4621, "exploring yourself": 5287, "diary pages": 5577,
  "tank controls": 4773, "isolation": 5409, "adapted to - movie": 369, "e3 2003": 1616, "e3 2002": 1615, "fate": 2292, "fan translation - portuguese": 4477,
  "fandub - brazilian portuguese": 4478, "adult": 1185, "deer": 4356, "skeleton": 1745, "multiple protagonists": 1525, "hospital": 1031, "gore": 101,
  "steam trading cards": 2384, "atmospheric": 3008, "easter egg": 495, "dog": 887, "nudity": 799, "steam greenlight": 2728, "mental health": 2391, "platform exclusive": 1759,
  "developer voice acting": 2868, "cat": 1207, "pop culture reference": 2073, "game reference": 3402, "non-humanoid protagonist": 3303, "descendants of other characters": 1787,
  "corpse": 1666, "moral decisions": 3252, "depression": 2159, "developer cameo": 2778, "bread": 1784, "british accent": 1546, "suicide": 2706, "game with chapters": 1382,
  "flashback": 1136, "psychopathy": 1976, "vent crawling": 4271, "photography": 271, "yokai": 1910, "audio logs": 5257, "mercenary": 3593, "ghostbusting": 5924,
  "ghostly manifestation": 8993, "xbox 360 backwards": 13295, "ps2 classics": 1267, "hiding": 1361, "jump scare moment": 5176, "multiple gameplay perspectives": 5209,
  "tragic villain": 9854, "steam achievements": 1866, "human": 4353, "tape recorder": 4641, "love triangle": 5393, "rat": 1486, "party system": 246, "special attacks": 5256,
  "motion blur": 1230, "shopping": 1286, "side quests": 2513, "questing": 3555, "potion": 1132, "a.i. companion": 4382, "male antagonist": 2705, "stat tracking": 2588,
  "political thriller": 2964, "coming of age": 2158, "floating island": 2045, "terrorists": 2423, "healer": 1968, "level cap": 2026, "skill tree": 2909, "mana": 1423,
  "not-so-bad guys": 4731, "teenager": 1627, "androgyny": 3341, "poisoning": 2779, "scripted events": 4402, "basilisks": 4337, "fast traveling": 2630,
  "airship": 1246, "status effects": 1424, "black magic": 2678, "seasons": 4141, "tragic hero": 8983, "pickpocketing anatomy": 3438, "bounty hunting": 3098, "corruption": 2131,
  "heroic sacrifice": 2207, "dark past": 1930, "j-pop": 1295, "evil empire": 364, "reluctant hero": 1507, "adamantium": 3782, "greatest hits": 1969, "white magic": 2632,
  "geomancer": 4709, "passive ability": 1577, "kill quest": 2411, "pom-pom": 5283, "promotional drink tie-in": 3841, "international version": 3388, "soft reset": 2178,
  "fate": 2292, "summoning support": 3473, "kingdom": 1299, "minigames": 410, "story driven": 1224, "steampunk": 736, "micromanagement": 1470, "sacrifice": 403, "conspiracy": 2739,
  "mad scientist": 348, "day/night cycle": 1177, "voice acting": 1396, "stat tracking": 2588, "questing": 3555, "potion": 1132, "skill points in game": 5277, "bow and arrow": 1505,
  "loot gathering": 3228, "transforming boss": 5723, "rat": 1486, "full motion video": 273, "original soundtrack release": 2934, "motion blur": 1230, "profanity": 1138,
  "tyrannosaurus rex": 3466, "treasure chest": 1381, "resistance": 1213, "melee": 4635, "real-time combat": 347, "stat tracking": 2588, "blindness": 3247, "stat tracking": 2588,
  "multiple enemy boss fights": 2033, "particle system": 1198, "summoners": 4751, "cutscene pause": 4612, "tech trees": 2272, "pausable real time combat": 2379, "regicide": 2221,
  "mana": 1423, "not-so-bad guys": 4731, "teenager": 1627, "in-engine cinematic": 1392, "ai programming": 2398, "passive ability": 1577, "surprising character switches": 3105,
  "context sensitive": 2576, "airship": 1246, "disc streaming": 750, "creature compendium": 1320, "status effects": 1424, "season": 4141, "pickpocketing anatomy": 3438,
  "steelbook": 3416, "bounty hunting": 3098, "corruption": 2131, "heroic sacrifice": 2207, "war veterans": 2239, "dark past": 1930, "greatest hits": 1969, "international version": 3388
};

// Funções auxiliares
function extractGameTitle(question) {
  let m = question?.match(/["“”](.*?)["“”]/);
  if (m) return m[1];
  m = question?.match(/s[ée]rie ([\w\s:]+)/i);
  if (m) return m[1].trim();
  return null;
}
function extractYear(text) {
  if (!text) return undefined;
  const match = text.match(/20\d{2}/);
  return match ? parseInt(match[0]) : undefined;
}
function extractGenres(text) {
  if (!text) return [];
  return Object.keys(genres).filter(g => text.toLowerCase().includes(g)).map(g => genres[g]);
}
function extractPlatforms(text) {
  if (!text) return [];
  return Object.keys(platforms).filter(p => text.toLowerCase().includes(p)).map(p => platforms[p]);
}
function extractThemes(text) {
  if (!text) return [];
  return Object.keys(themes).filter(t => text.toLowerCase().includes(t)).map(t => themes[t]);
}
function extractKeywords(text) {
  if (!text || typeof keywords !== "object") return [];
  return Object.keys(keywords).filter(k => text.toLowerCase().includes(k)).map(k => keywords[k]);
}
function extractProtagonist(text) {
  if (!text) return false;
  const re = /protagonista feminina|female protagonist|mulher|girl|garota|woman/i;
  return re.test(text);
}

function parseGameQuery(question) {
  let searchParts = [];
  const title = extractGameTitle(question);
  if (title) searchParts.push(title);
  if (extractProtagonist(question)) searchParts.push("female protagonist");

  const genreIds = Array.isArray(extractGenres(question)) ? extractGenres(question) : [];
  const platformIds = Array.isArray(extractPlatforms(question)) ? extractPlatforms(question) : [];
  const themeIds = Array.isArray(extractThemes(question)) ? extractThemes(question) : [];
  const keywordIds = Array.isArray(extractKeywords(question)) ? extractKeywords(question) : [];
  const year = extractYear(question);

  let search = searchParts.join(" ").trim();
  if (!search && question) search = question.trim();

  return {
    search,
    genreId: genreIds.length ? genreIds[0] : undefined,
    platformId: platformIds.length ? platformIds[0] : undefined,
    themeId: themeIds.length ? themeIds[0] : undefined,
    keywordIds: keywordIds,
    year: year,
    limit: 30
  };
}

// Controle de token
let accessToken = '';
let tokenExpiration = 0;
async function getAccessToken() {
  if (Date.now() < tokenExpiration && accessToken) return accessToken;
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

// Endpoint inteligente
app.get('/games/ask', async (req, res) => {
app.get('/games/ask', async (req, res) => {
  try {
    const pergunta = req.query.question || "";
    const { search, genreId, platformId, themeId, keywordIds, year, limit } = parseGameQuery(pergunta);

    let filters = [];
    if (typeof genreId !== 'undefined') filters.push(`genres = (${genreId})`);
    if (typeof themeId !== 'undefined') filters.push(`themes = (${themeId})`);
    if (typeof platformId !== 'undefined') filters.push(`platforms = (${platformId})`);
    if (Array.isArray(keywordIds) && keywordIds.length > 0) filters.push(`keywords = (${keywordIds.join(",")})`);
    if (year) filters.push(`first_release_date >= ${year}-01-01 & first_release_date <= ${year}-12-31`);

    // Aqui vai a montagem correta da query
    let igdbQuery = "";
    if (search && filters.length === 0) {
      igdbQuery += `search "${search}";\n`;
    }
    igdbQuery += "fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name, keywords.name;\n";
    if (!search && filters.length > 0) {
      igdbQuery += `where ${filters.join(' & ')};\n`;
    }
    igdbQuery += `limit ${limit};`;

    // LOG pra debug: sempre deixe ligado até funcionar
    console.log('\n--- IGDB QUERY ---\n' + igdbQuery + '\n------------------\n');

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
    console.error(error?.response?.data || error.message);
    res.json({ fallback: true, results: [], message: 'Erro na conexão com a IGDB.' });
  }
});

// Endpoint manual
app.get('/games', async (req, res) => {
  try {
    const token = await getAccessToken();
    const query = req.query.search || '';
    const genreId = req.query.genreId;
    const themeId = req.query.themeId;
    const platformId = req.query.platformId;
    const keywordIds = req.query.keywordIds ? req.query.keywordIds.split(',').map(x => x.trim()) : [];
    const year = req.query.year;
    const limit = req.query.limit || 30;

    let filters = [];
    if (typeof genreId !== 'undefined') filters.push(`genres = (${genreId})`);
    if (typeof themeId !== 'undefined') filters.push(`themes = (${themeId})`);
    if (typeof platformId !== 'undefined') filters.push(`platforms = (${platformId})`);
    if (Array.isArray(keywordIds) && keywordIds.length > 0) filters.push(`keywords = (${keywordIds.join(",")})`);
    if (year) filters.push(`first_release_date >= ${year}-01-01 & first_release_date <= ${year}-12-31`);

    const igdbQueryArr = [];
    if (query && query.trim().length > 0) igdbQueryArr.push(`search "${query}";`);
    igdbQueryArr.push("fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name, keywords.name;");
    if (filters.length > 0) igdbQueryArr.push(`where ${filters.join(' & ')};`);
    igdbQueryArr.push(`limit ${limit};`);
    const igdbQuery = igdbQueryArr.join('\n');

    // (Opcional) Debug
    console.log('\n--- IGDB QUERY ---\n' + igdbQuery + '\n------------------\n');

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
    console.error(error?.response?.data || error.message);
    res.json({ fallback: true, results: [], message: 'Erro na conexão com a IGDB.' });
  }
});

app.listen(port, () => {
  console.log(`Proxy rodando em http://localhost:${port}`);
});
