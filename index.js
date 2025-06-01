// index.js atualizado com melhorias nos filtros e console.log para debug import express from 'express'; import axios from 'axios'; import dotenv from 'dotenv'; dotenv.config();

const app = express(); const port = process.env.PORT || 3000;

// Dicionários const genres = { "horror": 2, "jrpg": 12 }; const keywords = { "female protagonist": 962 };

// GENRES, PLATFORMS, THEMES
const genres = {
  "terror": 2,
  "horror": 2,
  "rpg": 12,
  "jrpg": 12,
  "aventura": 31,
  "adventure": 31,
  "ação": 5,
  "action": 5,
  "simulação": 13,
  "simulation": 13,
  "plataforma": 8,
  "platformer": 8
};
const platforms = {
  "ps2": 7,
  "playstation 2": 7,
  "ps3": 9,
  "playstation 3": 9,
  "ps4": 48,
  "playstation 4": 48,
  "ps5": 167,
  "playstation 5": 167,
  "switch": 130,
  "nintendo switch": 130,
  "pc": 6,
  "xbox": 11,
  "xbox one": 49,
  "xbox series": 169
};
const themes = {
  "low poly": 20,
  "experimental": 20,
  "survival": 19,
  "mystery": 43,
  "psicológico": 31,
  "psychological": 31,
  "indie": 32
};

// ————————————
// Cole AQUI o seu bloco completo de keywords.json.
// Só depois de confirmar que o servidor acima está funcionando, substitua estas linhas:
// const keywords = { ... };
// por:
// import keywords from "./keywords.json";
// Ou então cole diretamente um objeto semelhante a keywords.json.
// ————————————
const keywords = {
  // === Horror, RPG, JRPG keywords (suas + sugestões) ===
  "ghosts": 16,
  "exploration": 552,
  "bloody": 1273,
  "disease": 613,
  "detective": 1575,
  "murder": 278,
  "death": 558,
  "female protagonist": 962,
  "action-adventure": 269,
  "religion": 146,
  "parallel worlds": 435,
  "backtracking": 342,
  "multiple endings": 1313,
  "dialogue trees": 2726,
  "revenge": 1058,
  "camera": 1834,
  "survival horror": 1836,
  "sequel": 2236,
  "good vs evil": 2168,
  "bats": 1398,
  "cult": 637,
  "no jumping": 3528,
  "rituals": 360,
  "darkness": 223,
  "boss fight": 3846,
  "single-player only": 2047,
  "anthropomorphism": 1175,
  "playstation trophies": 1266,
  "alternate costumes": 4266,
  "ranking system": 3250,
  "polygonal 3d": 3745,
  "full motion video": 273,
  "white noise": 4325,
  "non-player character": 4378,
  "save point": 4653,
  "sprinting mechanics": 4647,
  "branching storyline": 540,
  "melee": 4635,
  "real-time combat": 347,
  "videotape": 2713,
  "infinite ammo": 4166,
  "difficulty level": 1087,
  "scary children": 3192,
  "female antagonist": 5175,
  "plot twist": 3300,
  "evil organization": 302,
  "linear gameplay": 3157,
  "ambient music": 1017,
  "new protagonist in sequel": 4150,
  "new game plus": 4826,
  "satanism": 604,
  "innocent people die": 7185,
  "optional censorship": 2296,
  "shooting range": 1535,
  "reincarnation": 2872,
  "tragic hero": 8983,
  "plane shifting": 1826,
  "diary pages": 5577,
  "tank controls": 4773,
  "isolation": 5409,
  "adapted to - movie": 369,
  "adult": 1185,
  "multiple protagonists": 1525,
  "hospital": 1031,
  "gore": 101,
  "atmospheric": 3008,
  "mental health": 2391,
  "cat": 1207,
  "pop culture reference": 2073,
  "game reference": 3402,
  "depression": 2159,
  "suicide": 2706,
  "flashback": 1136,
  "hallucination": 1383,
  "photography": 271,
  "audio logs": 5257,
  "mercenary": 3593,
  "hiding": 1361,
  "jump scare moment": 5176,
  "tragic villain": 9854,
  "love triangle": 5393,
  "rat": 1486,
  "party system": 246,
  "side quests": 2513,
  "a.i. companion": 4382,
  "political thriller": 2964,
  "coming of age": 2158,
  "floating island": 2045,
  "healer": 1968,
  "level cap": 2026,
  "skill tree": 2909,
  "mana": 1423,
  "not-so-bad guys": 4731,
  "teenager": 1627,
  "androgyny": 3341,
  "poisoning": 2779,
  "day/night cycle": 1177,
  "voice acting": 1396,
  "questing": 3555,
  "potion": 1132,
  "bow and arrow": 1505,
  "loot gathering": 3228,
  "transforming boss": 5723,
  "motion blur": 1230,
  "profanity": 1138,
  "resistance": 1213,
  "blindness": 3247,
  "multiple enemy boss fights": 2033,
  "particle system": 1198,
  "summoners": 4751,
  "tech trees": 2272,
  "summoning support": 3473,
  "minigames": 410,
  "story driven": 1224,
  "steampunk": 736,
  "micromanagement": 1470,
  "sacrifice": 403,
  "conspiracy": 2739,
  "mad scientist": 348,
  "inventory management": 1173,
  "supernatural": 2065,
  "psychological horror": 1975,
  "paranormal": 2870,
  "puzzle": 132,
  "dungeon crawler": 140,
  "turn-based combat": 144,
  "random encounters": 149,
  "character customization": 152,
  "romance": 2733,
  "time travel": 355,
  "leveling": 2738,
  "final boss": 4163,
  "transformation": 4717,
  "alchemy": 458,
  "summoning": 1477,
  "open world": 38,
  "dreams": 2929,
  "nightmare": 2956,
  "betrayal": 4396,
  "dark fantasy": 2823,
  "alternate reality": 3559,
  "sanity meter": 3052,
  "curse": 2436,
  "vampires": 1433,
  "werewolves": 1617,
  "demons": 407,
  "witchcraft": 2377,
  "zombies": 1559,
  "demon lord": 3073,
  "ancient ruins": 1418,
  "haunted house": 2465,
  "investigation": 2637,
  "undead": 1069,
  "end of the world": 1585,
  "dark past": 1930
  // pode adicionar mais conforme for achando!
};

// Funções auxiliares function extractGenres(text) { if (!text) return []; return Object.keys(genres).filter(g => text.toLowerCase().includes(g)).map(g => genres[g]); } function extractKeywords(text) { if (!text) return []; return Object.keys(keywords).filter(k => text.toLowerCase().includes(k)).map(k => keywords[k]); } function extractProtagonist(text) { return /female protagonist|protagonista feminina/i.test(text); } function extractYear(text) { const match = text?.match(/20\d{2}/); return match ? parseInt(match[0]) : undefined; }

function parseGameQuery(question) { let search = question?.trim() || ""; const genreId = extractGenres(search)[0]; const keywordIds = extractKeywords(search); if (extractProtagonist(search) && !keywordIds.includes(962)) keywordIds.push(962); const year = extractYear(search);

return { search, genreId, keywordIds, year, limit: 30 }; }

// Controle de token let accessToken = ''; let tokenExpiration = 0; async function getAccessToken() { if (Date.now() < tokenExpiration && accessToken) return accessToken; const response = await axios.post('https://id.twitch.tv/oauth2/token', null, { params: { client_id: process.env.CLIENT_ID, client_secret: process.env.CLIENT_SECRET, grant_type: 'client_credentials' } }); accessToken = response.data.access_token; tokenExpiration = Date.now() + response.data.expires_in * 1000; return accessToken; }

// Endpoint inteligente app.get('/games/ask', async (req, res) => { try { const pergunta = req.query.question || ""; const { search, genreId, keywordIds, year, limit } = parseGameQuery(pergunta);

let filters = [];
if (genreId) filters.push(`(genres = (${genreId}) | themes = (${genreId}))`);
if (Array.isArray(keywordIds) && keywordIds.length > 0) filters.push(`keywords = (${keywordIds.join(',')})`);
if (year) filters.push(`first_release_date >= ${year}-01-01 & first_release_date <= ${year}-12-31`);

const igdbQueryArr = [];
if (search.length) igdbQueryArr.push(`search \"${search}\";`);
igdbQueryArr.push("fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name, keywords.name;");
if (filters.length > 0) igdbQueryArr.push(`where ${filters.join(' & ')};`);
igdbQueryArr.push(`limit ${limit};`);
const igdbQuery = igdbQueryArr.join('\n');

// Debug: mostra a query gerada
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
    res.json({
      fallback: true,
      results: [],
      message: 'Erro na conexão com a IGDB.'
    });
  }
});
