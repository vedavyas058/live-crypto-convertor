const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5001;
const CMC_API_KEY = process.env.CMC_API || '';

function cmcHeaders() {
  const headers = {};
  if (CMC_API_KEY) headers['X-CMC_PRO_API_KEY'] = CMC_API_KEY;
  return headers;
}

// ✅ DEFAULT CONVERT SET TO INR
app.get('/api/coins', async (req, res) => {
  try {
    const convert = req.query.convert || 'INR';
    const limit = req.query.limit || '5000';

    const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=${encodeURIComponent(limit)}&convert=${convert}`;
    const r = await axios.get(url, { headers: cmcHeaders(), timeout: 15000 });

    const list = r.data?.data || [];

    const normalized = list.map(c => {
      return {
        id: c.slug,
        symbol: c.symbol,
        name: c.name,
        image: `https://s2.coinmarketcap.com/static/img/coins/64x64/${c.id}.png`,
        cmc_id: c.id,
        market_cap: c.quote?.INR?.market_cap || null,
        current_price: { inr: c.quote?.INR?.price || null },
        change24h: c.quote?.INR?.percent_change_24h || null
      };
    });

    return res.json(normalized);
  } catch (err) {
    console.error('coins error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Failed to fetch coins',
      details: err.response?.data || err.message
    });
  }
});

// ✅ PRICE API ALSO DEFAULT INR
app.get('/api/price', async (req, res) => {
  const ids = req.query.ids;
  const symbol = req.query.symbol;

  const convertRaw = req.query.convert || 'INR';

  if (!ids && !symbol) {
    return res.status(400).json({
      error: 'Query parameter "ids" or "symbol" is required'
    });
  }

  const params = {};
  if (ids) params.slug = ids;
  if (symbol) params.symbol = symbol;
  params.convert = convertRaw;

  try {
    const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
    const r = await axios.get(url, { headers: cmcHeaders(), params, timeout: 15000 });
    const data = r.data?.data || {};

    const out = {};
    Object.values(data).forEach(coin => {
      const key = coin.slug || coin.symbol || coin.id;
      out[key] = {
        id: coin.slug,
        symbol: coin.symbol,
        name: coin.name,
        prices: { inr: coin.quote?.INR?.price || null },
        change24h: coin.quote?.INR?.percent_change_24h || null
      };
    });

    return res.json(out);
  } catch (err) {
    console.error('price error:', err.response?.data || err.message);
    return res.status(500).json({
      error: 'Failed to fetch price',
      details: err.response?.data || err.message
    });
  }
});

app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
