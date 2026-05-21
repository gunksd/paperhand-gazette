// Proxy CoinGecko - no key needed, but proxying gives us caching + hides any future pro key
export default async function handler(req, res) {
  const { path, ...rest } = req.query;
  if (!path) return res.status(400).json({ error: 'missing path' });

  // allow only safe paths
  if (!/^[a-zA-Z0-9_\-\/]+$/.test(path)) {
    return res.status(400).json({ error: 'invalid path' });
  }

  const qs = new URLSearchParams(rest).toString();
  const base = 'https://api.coingecko.com/api/v3';
  const url = `${base}/${path}${qs ? '?' + qs : ''}`;

  try {
    const headers = {};
    if (process.env.COINGECKO_KEY) {
      headers['x-cg-demo-api-key'] = process.env.COINGECKO_KEY;
    }
    const r = await fetch(url, { headers });
    const data = await r.json();
    // Cache aggressively — price/ATH doesn't change every second
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=3600');
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'coingecko upstream failed', detail: String(e) });
  }
}
