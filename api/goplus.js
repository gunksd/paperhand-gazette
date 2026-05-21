export default async function handler(req, res) {
  const { addr } = req.query;
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return res.status(400).json({ error: 'invalid address' });
  }

  const url = `https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=${addr}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // honeypot status barely changes
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'goplus upstream failed', detail: String(e) });
  }
}
