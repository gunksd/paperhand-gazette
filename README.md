# Paperhand Gazette · 纸手日报

> Obituaries for the coins you sold too early.
>
> imToken 10th-anniversary AI co-creation entry — a one-page on-chain newspaper that exhumes your biggest "paperhand" sell and prints an obituary for it.

- Live: https://paperhand-gazette-c8y7ccs7n-awans-projects-a3a304b4.vercel.app
- Repo: https://github.com/gunksd/paperhand-gazette

## What it does

1. Connect a wallet (read-only, EIP-1193 / EIP-6963).
2. Pull every ERC-20 transfer for that address from Etherscan v2.
3. Treat outgoing transfers as "sells", deduplicate by token contract.
4. Run each token through GoPlus token-security to drop honeypots, blacklisted, high sell-tax, non-sellable, and closed-source contracts.
5. Look up each survivor on CoinGecko: ATH price + historical sell-day price.
6. Compute `lostUSD = amountSold × athPrice − received` and rank.
7. Render the front page as a Victorian-newspaper obituary, with sub-obits for the runners-up.

Special editions:

- **Clean Hands edition** — wallet has no ERC-20 history (or every sold token was filtered out). Replaces the obit with a "no obituaries to print" notice.
- **Sample edition** — runs without a wallet so anyone can preview.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Single-file `index.html`, ethers v6, qrcodejs, html2canvas | No build step. Works in any wallet's in-app browser. |
| Backend | Vercel serverless functions (`/api/*`) | Hides API keys; adds CDN cache (`s-maxage`). |
| Wallet | EIP-1193 + EIP-6963 + async-injection wait | imToken/Coinbase/Rabby inject `window.ethereum` asynchronously; first-paint button clicks were racing. |
| Chain data | Etherscan v2 multichain (`chainid=1`) | Free, covers full ERC-20 history. |
| Prices | CoinGecko free API + Demo key | ATH and historical price (`/coins/{id}/history?date=DD-MM-YYYY`). |
| Security | GoPlus `token_security/1` | Free honeypot/scam classifier. |
| Sharing | html2canvas → PNG | Generates a shareable obituary image (download / clipboard / `navigator.share`). |
| i18n | Vanilla `data-i18n` + `LANG` dictionary | EN / 中文. |

## API routes

All proxied through Vercel serverless so no keys are exposed to the browser.

- `GET /api/transfers?addr=0x…` — Etherscan v2 ERC-20 history (`s-maxage=300`)
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

- **Desktop with MetaMask / Rabby** — open the URL, click "Read My Obituary", approve the connect prompt.
- **Mobile imToken** — paste the URL into the imToken in-app browser, or scan the QR shown by the desktop page, then tap "Read My Obituary".
- **No wallet** — click "See a sample edition" to view a curated demo with PEPE / SOL / SHIB / LINK / RNDR / INJ.
- After the report renders, hit "Share This Obituary" to generate a PNG (download / copy / system-share).
- Hit "Try another wallet" to return to the landing page and connect a different address.

## Caveats

- We label outgoing ERC-20 transfers as "sells". A transfer from your wallet to a friend or to a non-DEX contract is also counted; for sharper accuracy you would whitelist Uniswap / SushiSwap / 0x routers.
- We use *lifetime* ATH, not peak-after-sell. So a token that already ATH'd before you sold will still print a number; sometimes the "loss" is small or negative and falls below tokens you genuinely paperhanded.
- "Lost" is the USD that bag would be at ATH today minus what you received — fictional in the sense that nobody sells at the exact top. The Gazette is honest about that on the landing page.

## License

MIT.
