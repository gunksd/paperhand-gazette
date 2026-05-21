export default async function handler(req, res) {
  const { addr } = req.query;
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return res.status(400).json({ error: "invalid address" });
  }

  const key = process.env.ETHERSCAN_KEY;
  if (!key) return res.status(500).json({ error: "ETHERSCAN_KEY not set" });

  // Etherscan v2 multichain API, chainid=1 for Ethereum mainnet
  const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=tokentx&address=${addr}&startblock=0&endblock=99999999&sort=asc&apikey=${key}`;

  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate");
    return res.status(200).json(data);
  } catch (e) {
    return res
      .status(502)
      .json({
        error: "etherscan upstream failed",
        detail: String(e?.cause || e),
      });
  }
}
