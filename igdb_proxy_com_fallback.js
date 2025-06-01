
import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

let accessToken = null;

async function authenticate() {
  const authResponse = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'client_credentials'
    }
  });

  accessToken = authResponse.data.access_token;
}

// Função fallback usando busca pública
async function buscarFallbackGoogle(termo) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(termo + ' site:ign.com OR site:gamespot.com')}`;
  return { fallback: true, resultado: `Nenhum resultado exato na IGDB. Tente olhar aqui: ${url}` };
}

app.get('/games', async (req, res) => {
  const search = req.query.search || '';
  const genreId = req.query.genreId;
  const themeId = req.query.themeId;
  const platform = req.query.platform;
  const month = parseInt(req.query.month);
  const year = parseInt(req.query.year);

  try {
    if (!accessToken) await authenticate();

    const headers = {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${accessToken}`
    };

    let whereClauses = [];
    if (genreId) whereClauses.push(`genres = (${genreId})`);
    if (themeId) whereClauses.push(`themes = (${themeId})`);
    if (platform) whereClauses.push(`platforms = (${platform})`);
    if (month && year) {
      const startDate = Math.floor(new Date(year, month - 1, 1).getTime() / 1000);
      const endDate = Math.floor(new Date(year, month, 1).getTime() / 1000);
      whereClauses.push(`first_release_date >= ${startDate} & first_release_date < ${endDate}`);
    }

    const where = whereClauses.length ? `where ${whereClauses.join(' & ')};` : '';

    const query = `
      search "${search}";
      ${where}
      fields name, summary, genres.name, themes.name, platforms.name, rating, first_release_date, cover.url;
      limit 15;
    `;

    const response = await axios.post('https://api.igdb.com/v4/games', query, { headers });

    if (!response.data || response.data.length === 0) {
      const fallback = await buscarFallbackGoogle(search);
      return res.json(fallback);
    }

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ erro: "Erro IGDB", detalhe: error.response?.data || error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
