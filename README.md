# Paperhand Gazette

Obituaries for the coins you sold too early. An imToken 10th-anniversary AI co-creation entry.

## Local development

```bash
export ETHERSCAN_KEY=your_key_here
npx vercel dev
```

Or static-only (sample edition works without keys):

```bash
python3 -m http.server 7788
```

## Deploy to Vercel

1. Push to GitHub
2. Import the repo at vercel.com
3. Add environment variable in Project Settings → Environment Variables:
   - `ETHERSCAN_KEY` = your free key from https://etherscan.io/apis
   - `COINGECKO_KEY` (optional) = demo key from https://www.coingecko.com/en/api
4. Deploy

## API routes

All proxied through Vercel serverless so no keys are exposed to the browser.

- `GET /api/transfers?addr=0x…` — Etherscan ERC20 history
- `GET /api/coingecko?path=coins/ethereum/contract/0x…` — CoinGecko proxy
- `GET /api/goplus?addr=0x…` — GoPlus honeypot check
