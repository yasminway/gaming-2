import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const clientId = process.env.TWITCH_CLIENT_ID;
const clientSecret = process.env.TWITCH_CLIENT_SECRET;

let accessToken = null;

async function getAccessToken() {
  const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials'
    }
  });
  accessToken = response.data.access_token;
}

app.get('/games', async (req, res) => {
  const { search } = req.query;

  if (!accessToken) await getAccessToken();

  try {
    const query = `
      search "${search}";
      fields *, cover.url, genres.name, platforms.name, involved_companies.company.name,
        screenshots.url, artworks.url, videos.video_id, game_engines.name,
        game_modes.name, player_perspectives.name, themes.name, keywords.name,
        dlcs.name, expansions.name, remakes.name, remasters.name, bundles.name,
        franchise.name, similar_games.name;
      limit 50;
    `;

    const response = await axios.post('https://api.igdb.com/v4/games', query, {
      headers: {
        'Client-ID': clientId,
        ''Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ erro: 'Erro IGDB', detalhe: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Servidor rodando na porta \${PORT}\`);
});
