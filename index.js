import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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

app.get('/games', async (req, res) => {
  try {
    const token = await getAccessToken();
    const query = req.query.search || '';
    const genreId = req.query.genreId;
    const themeId = req.query.themeId;
    const platformId = req.query.platformId;
    const year = req.query.year;

    let filters = [];
    if (genreId) filters.push(`genres = (${genreId})`);
    if (themeId) filters.push(`themes = (${themeId})`);
    if (platformId) filters.push(`platforms = (${platformId})`);
    if (year) filters.push(`first_release_date >= ${year}-01-01 & first_release_date <= ${year}-12-31`);

    const igdbQuery = `
      search "${query}";
      fields name, summary, genres.name, platforms.name, cover.url, first_release_date, rating, themes.name;
      ${filters.length > 0 ? `where ${filters.join(' & ')};` : ''}
      limit 30;
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
