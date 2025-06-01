
// Mini parser de linguagem natural para gerar filtros da IGDB

function gerarQueryIGDB(texto) {
  const genreMap = {
    "jrpg": 12,
    "rpg de ação": 5,
    "ação": 4,
    "aventura": 31,
    "roguelike": 24,
    "terror": 18,
    "soulslike": 25,
    "indie": 32,
    "puzzle": 7,
    "shooter": 9,
    "visual novel": 35
  };

  const themeMap = {
    "melancólica": 41,
    "melancólico": 41,
    "cozy": 43,
    "drama": 31,
    "surreal": 27,
    "romance": 39,
    "psicológico": 31,
    "dark fantasy": 31,
    "histórico": 38,
    "sci-fi": 36,
    "ficção científica": 36,
    "thriller": 19
  };

  const platformMap = {
    "ps2": 9,
    "playstation 2": 9,
    "ps4": 48,
    "ps5": 167,
    "switch": 130,
    "nintendo switch": 130,
    "3ds": 37,
    "pc": 6,
    "mac": 14,
    "linux": 3,
    "wii": 5,
    "xbox": 11,
    "android": 21,
    "ios": 34
  };

  const monthMap = {
    "janeiro": 1, "fevereiro": 2, "março": 3, "abril": 4, "maio": 5,
    "junho": 6, "julho": 7, "agosto": 8, "setembro": 9,
    "outubro": 10, "novembro": 11, "dezembro": 12
  };

  const query = { limit: 50 };
  const texto = texto.toLowerCase();

  for (const chave in genreMap) {
    if (texto.includes(chave)) query.genreId = genreMap[chave];
  }
  for (const chave in themeMap) {
    if (texto.includes(chave)) query.themeId = themeMap[chave];
  }
  for (const chave in platformMap) {
    if (texto.includes(chave)) query.platform = platformMap[chave];
  }
  for (const chave in monthMap) {
    if (texto.includes(chave)) query.month = monthMap[chave];
  }

  const ano = texto.match(/\b(20\d{2})\b/);
  if (ano) query.year = parseInt(ano[1]);

  if (texto.includes("protagonista feminina")) query.search = "female protagonist";

  return query;
}

// Exemplo
console.log(gerarQueryIGDB("me mostra JRPGs de terror com vibe melancólica que vão sair em julho pra Switch em 2025"));
