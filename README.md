# Paperhand Gazette · 纸手日报

> Obituaries for the coins you sold too early.
>
> imToken 10th-anniversary AI co-creation entry — a one-page on-chain newspaper that exhumes your biggest "paperhand" sell and prints an obituary for it.

- Live: https://paperhand-gazette.vercel.app
- Repo: https://github.com/gunksd/paperhand-gazette
- 中文 README：[README_zh.md](./README_zh.md)

## What it does

1. Connect a wallet (read-only, EIP-1193 / EIP-6963).
2. Pull every ERC-20 transfer for that address from Etherscan v2.
3. Identify real **buy → sell-to-DEX** events per token (see Detection logic below). Wallet-to-wallet transfers, bridges, deposits and stablecoins are excluded.
4. Run each surviving token through GoPlus token-security to drop honeypots, blacklisted, high sell-tax, non-sellable, and closed-source contracts.
5. For each survivor, fetch its **peak price *after the first buy*** from CoinGecko `market_chart/range` (falls back to lifetime ATH on failure). Tokens whose peak-since-buy is ≤ the sell price are dropped — no real paperhand story there.
6. Compute `lostUSD = soldAmount × peakSinceBuy − received` and rank.
7. Render the front page as a Victorian-newspaper obituary, with sub-obits for the runners-up.

Special editions:

- **Clean Hands edition** — wallet has no qualifying paperhand sells (or every candidate was filtered out). Replaces the obit with a "no obituaries to print" notice.
- **Sample edition** — runs without a wallet so anyone can preview.

## Detection logic

We care about *paperhand* sells, not every outgoing transfer. A token only counts if **all** of these hold:

1. **You bought it first.** The first IN of that token must precede any qualifying OUT (`firstSeen` = first IN timestamp).
2. **The OUT is a swap, not a transfer.** A transfer counts as a swap if either:
   - the destination is a known DEX router (Uniswap V2 / V3 / Universal Router / V4, SushiSwap, PancakeSwap Smart/V3/V2, 1inch V5/V6, 0x, Paraswap V5/V6, CowSwap GPv2, Permit2), **or**
   - the same tx hash also contains an IN of a *different* token to your wallet (the universal hallmark of an atomic swap — covers Uniswap V2/V3 pool-direct routes where the `to` address is the pool, plus any aggregator that splits across pools).
3. **It is not a stablecoin.** Hard contract list (USDC / USDT / DAI / BUSD / TUSD / USDP / FRAX / LUSD / PYUSD / sUSD / GUSD / EURS / EURT) plus a `^USD*` / `^EUR*` symbol heuristic.

This catches real DEX sells across Uniswap-style AMMs without maintaining an exhaustive pool address list, while excluding wallet-to-wallet transfers, bridges, CEX deposits, and gifts.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Single-file `index.html`, ethers v6, qrcodejs, html2canvas | No build step. Works in any wallet's in-app browser. |
| Backend | Vercel serverless functions (`/api/*`) | Hides API keys; adds CDN cache (`s-maxage`). |
| Wallet | EIP-1193 + EIP-6963 + async-injection wait + `wallet_requestPermissions` for re-prompt | imToken/Coinbase/Rabby inject `window.ethereum` asynchronously; first-paint button clicks were racing. |
| Chain data | Etherscan v2 multichain (`chainid=1`, newest 10k tokentx) | Free, covers full ERC-20 history within the serverless budget. |
| Prices | CoinGecko free API + Demo key | Lifetime ATH, sell-day historical price, and `market_chart/range` for peak-since-buy. |
| Security | GoPlus `token_security/1` | Free honeypot/scam classifier. |
| Sharing | html2canvas → PNG, fixed 1080×1350 off-screen card | gmgn-style dark card with masked address (`0xab12…cd34`) and QR; download / clipboard / `navigator.share`. |
| i18n | Vanilla `data-i18n` + `LANG` dictionary | EN / 中文. |

## API routes

All proxied through Vercel serverless so no keys are exposed to the browser.

- `GET /api/transfers?addr=0x…` — Etherscan v2 ERC-20 history (`maxDuration=30`, `s-maxage=300`)
- `GET /api/coingecko?path=coins/ethereum/contract/0x…` — CoinGecko proxy (`s-maxage=600`)
- `GET /api/goplus?addr=0x…` — GoPlus honeypot check (`s-maxage=86400`)

## Local development

```bash
export ETHERSCAN_KEY=your_key
export COINGECKO_KEY=your_demo_key   # optional
vercel dev
```

Static-only (sample edition works without keys):

```bash
python3 -m http.server 7788
```

## Deploy

```bash
vercel deploy --prod
```

Set in Project Settings → Environment Variables:

- `ETHERSCAN_KEY` — https://etherscan.io/apis (free)
- `COINGECKO_KEY` — https://www.coingecko.com/en/api (Demo key, free)

If your project has SSO Protection enabled, disable it via:

```
PATCH https://api.vercel.com/v9/projects/{id}?teamId={team}
{"ssoProtection": null}
```

## Token Core integration

Token Core is imToken's wallet engine. It normalises wallet behaviour across mobile, hardware, and dApp browser environments and exposes EIP-1193 inside the imToken in-app browser. The Gazette uses it three ways:

1. **Address resolution & connection** — when opened inside the imToken in-app browser, `window.ethereum` is provided by Token Core. We treat it as a standard EIP-1193 provider and request `eth_requestAccounts`. No private keys, no signing of state-changing transactions.
2. **EIP-6963 multi-provider awareness** — Token Core announces itself via `eip6963:announceProvider` so the page does not race with other injected wallets. We listen for the announce event before falling back to legacy `window.ethereum`.
3. **Mobile-first UX** — desktop visitors get a QR modal pointing at the same URL so they can re-open the page inside Token Core's mobile browser, where the connect step is one tap (no extension to install).

### Materials referenced

- **imToken 10th-anniversary AI co-creation prompt repo** (token-im / 10th anniversary materials) — used to anchor the brand language and the "co-creation" framing in the masthead and footer.
- **Token Core public surface** — only the parts that show up to a dApp: the EIP-1193 `request` / `eth_requestAccounts` flow and the EIP-6963 announce-provider pattern. We did not link to or reproduce any internal SDK code; this is a website that *uses* Token Core via the standard wallet bridge, not a fork of it.
- **EIP-6963: Multi Injected Provider Discovery** — https://eips.ethereum.org/EIPS/eip-6963
- **GoPlus Token Security API** — https://docs.gopluslabs.io/reference/api-overview-token-security
- **Etherscan v2 multichain API** — https://docs.etherscan.io/etherscan-v2 (`tokentx` with `chainid=1`)
- **CoinGecko free API** — https://www.coingecko.com/en/api/documentation (`coins/{id}` and `coins/{id}/history`)

## How to use it (end-user)

- **Top-right wallet badge** — persistent. Shows "Connect Wallet" with a grey dot when disconnected; click it to connect. After connecting it turns green and shows your truncated address; click the address to copy the full version, or hit Disconnect to revoke.
- **Desktop with MetaMask / Rabby** — open the URL, click "Read My Obituary" (or the badge), approve the connect prompt.
- **Mobile imToken** — paste the URL into the imToken in-app browser, or scan the QR shown by the desktop page, then tap "Read My Obituary".
- **No wallet** — click "See a sample edition" to view a curated demo with PEPE / SOL / SHIB / LINK / RNDR / INJ.
- After the report renders, hit "Share This Obituary" to generate a 1080×1350 PNG (download / copy / system-share). The image masks the address as `0xab12…cd34`.
- Hit "Try another wallet" to return to the landing page and connect a different address.

## Caveats

- "Peak" is the *maximum daily-resolution price since the first buy* per token, from CoinGecko `market_chart/range`. If that call fails or returns empty, we fall back to lifetime ATH. Either way it is the *opportunity* price, not a fill price — nobody sells at the exact top.
- "Lost" is the USD that bag would be worth at the peak-since-buy minus what you received. Fictional in the sense that nobody actually catches the top. The Gazette is honest about that on the landing page.
- Etherscan returns at most 10,000 most-recent ERC-20 transfers per request. For very active wallets older history is truncated.
- Detection is heuristic-based — it does not parse swap logs at the contract level. The cross-token same-tx heuristic is robust for AMM swaps but may miss exotic flows (e.g. multi-hop trades that route through your wallet, fee rebates).

## License

MIT.
