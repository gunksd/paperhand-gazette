export const config = {
  // Hobby plan max is 60s. Big wallets can take a while.
  maxDuration: 30,
};

export default async function handler(req, res) {
  const { addr } = req.query;
  if (!addr || !/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return res.status(400).json({ status: "0", message: "invalid address", result: [] });
  }

  const key = process.env.ETHERSCAN_KEY;
  if (!key) {
    return res.status(500).json({ status: "0", message: "ETHERSCAN_KEY not set", result: [] });
  }

  // Etherscan v2 multichain API, chainid=1 for Ethereum mainnet.
  // Cap to 10k newest tx (Etherscan hard cap per request) so very active
  // wallets still come back within the function budget.
  const url =
    `https://api.etherscan.io/v2/api?chainid=1` +
    `&module=account&action=tokentx&address=${addr}` +
    `&page=1&offset=10000&sort=desc&apikey=${key}`;

  const ctl = new AbortController();
  const tid = setTimeout(() => ctl.abort(), 25_000);

  try {
    const r = await fetch(url, { signal: ctl.signal });
    const text = await r.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // Etherscan sometimes returns an HTML error page on rate-limit / outage.
      return res.status(502).json({
        status: "0",
        message: "etherscan returned non-JSON (likely rate-limited)",
        result: [],
        snippet: text.slice(0, 200),
      });
    }
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({
      status: "0",
      message:
        e?.name === "AbortError"
          ? "etherscan upstream timed out"
          : "etherscan upstream failed",
      result: [],
      detail: String(e?.cause || e?.message || e),
    });
  } finally {
    clearTimeout(tid);
  }
}
