# 纸手日报 · Paperhand Gazette

> 一份只为「卖飞」而办的报纸。
>
> imToken 十周年 AI 共创活动作品 —— 单页链上小报，挖出你最大的一次「纸手」卖出，给它印一份维多利亚式讣告。

- 在线体验：https://paperhand-gazette.vercel.app
- 仓库：https://github.com/gunksd/paperhand-gazette
- English README：[README.md](./README.md)

## 它做什么

1. 连接钱包（只读，EIP-1193 / EIP-6963）。
2. 从 Etherscan v2 拉取该地址全部 ERC-20 转账。
3. 把「转出」当作「卖出」，按合约去重。
4. 用 GoPlus token-security 过滤掉貔貅、黑名单、卖出税>10%、不可卖、非开源的合约。
5. 在 CoinGecko 上查每个幸存代币的 ATH 与卖出当日历史价。
6. 算 `卖飞美元 = 卖出数量 × ATH 价格 − 实际拿到`，排序。
7. 把最大的一笔做成头版讣告，其它的做成副讣告。

特殊版面：

- **Clean Hands 版**：钱包没有 ERC-20 历史，或者所有卖出代币都被过滤掉，会替换为「无讣告可印」的安静版面。
- **Sample 版**：不连钱包也能预览一份示例。

## 技术栈

| 层 | 选型 | 原因 |
|---|---|---|
| 前端 | 单文件 `index.html` + ethers v6 + qrcodejs + html2canvas | 无构建。所有钱包内置浏览器都跑得起来。 |
| 后端 | Vercel serverless（`/api/*`） | 隐藏 API key；加 CDN 缓存（`s-maxage`）。 |
| 钱包 | EIP-1193 + EIP-6963 + 异步注入等待 | imToken / Coinbase / Rabby 是异步注入 `window.ethereum` 的，首屏点按钮会抢跑。 |
| 链上数据 | Etherscan v2 multichain（`chainid=1`） | 免费，覆盖完整 ERC-20 历史。 |
| 价格 | CoinGecko 免费 API + Demo Key | ATH 与历史价（`/coins/{id}/history?date=DD-MM-YYYY`）。 |
| 安全 | GoPlus `token_security/1` | 免费貔貅/诈骗特征识别。 |
| 分享 | html2canvas → PNG | 1080×1350 卡片，地址打码后导出，可下载 / 复制 / 系统分享。 |
| 国际化 | 原生 `data-i18n` + `LANG` 字典 | 英文 / 中文。 |

## API 路由

所有都通过 Vercel serverless 代理，浏览器拿不到任何 key。

- `GET /api/transfers?addr=0x…` — Etherscan v2 ERC-20 历史（`s-maxage=300`）
- `GET /api/coingecko?path=coins/ethereum/contract/0x…` — CoinGecko 代理（`s-maxage=600`）
- `GET /api/goplus?addr=0x…` — GoPlus 貔貅检查（`s-maxage=86400`）

## 本地开发

```bash
export ETHERSCAN_KEY=你的_key
export COINGECKO_KEY=你的_demo_key   # 可选
vercel dev
```

纯静态（示例版可用，不需 key）：

```bash
python3 -m http.server 7788
```

## 部署

```bash
vercel deploy --prod
```

在 Vercel 项目设置 → Environment Variables 添加：

- `ETHERSCAN_KEY` — https://etherscan.io/apis （免费）
- `COINGECKO_KEY` — https://www.coingecko.com/en/api （Demo Key，免费）

如果项目开了 SSO Protection，关掉它：

```
PATCH https://api.vercel.com/v9/projects/{id}?teamId={team}
{"ssoProtection": null}
```

## Token Core 集成

Token Core 是 imToken 的钱包内核，统一了移动端 / 硬件 / dApp 浏览器三处的钱包行为，并在 imToken 内置浏览器里通过 EIP-1193 暴露给网页。本项目用到三处：

1. **地址解析与连接** —— 在 imToken 内置浏览器里 `window.ethereum` 就是 Token Core 提供的。我们按标准 EIP-1193 走 `eth_requestAccounts`，**只读、不签任何动钱交易**。
2. **EIP-6963 多 provider 共存** —— Token Core 会通过 `eip6963:announceProvider` 自报家门，避免和 MetaMask / Rabby 抢 `window.ethereum`。
3. **移动优先 UX** —— 桌面访问会显示一个二维码，指向同一个 URL，扫码后用 Token Core 的移动浏览器打开就能一键连接，不需要装扩展。

### 参考过哪些 Token Core 相关材料

- **imToken 十周年 AI 共创仓库**（10th.token.im 提供的素材）—— 报头与页脚的「共创」用语沿用了它的话术。
- **Token Core 对外暴露给 dApp 的部分** —— 仅用 EIP-1193 `request` / `eth_requestAccounts` 与 EIP-6963 announce-provider 这两层公开协议。没有 fork 或复制任何 SDK 内部代码。
- **EIP-6963: Multi Injected Provider Discovery** —— https://eips.ethereum.org/EIPS/eip-6963
- **GoPlus Token Security API** —— https://docs.gopluslabs.io/reference/api-overview-token-security
- **Etherscan v2 multichain API** —— https://docs.etherscan.io/etherscan-v2 （`tokentx` + `chainid=1`）
- **CoinGecko 免费 API** —— https://www.coingecko.com/en/api/documentation（`coins/{id}` 与 `coins/{id}/history`）

## 使用方式（终端用户）

- **桌面 + MetaMask / Rabby** —— 打开链接，点「读我的讣告」，授权连接。
- **手机 imToken** —— 用 imToken 内置浏览器打开链接，或扫描桌面端二维码，点「读我的讣告」。
- **不连钱包** —— 点「看一份样本」预览（PEPE / SOL / SHIB / LINK / RNDR / INJ）。
- 看完讣告点「分享我的讣告」生成 1080×1350 的 PNG 卡片，可下载 / 复制到剪贴板 / 系统分享。
- 点「换一个钱包试试」回到首页连接新地址。

## 已知限制

- 我们把「转出 ERC-20」当作「卖出」。给朋友转账或转给非 DEX 合约也会被计入；要更准就得维护一份 Uniswap / SushiSwap / 0x 路由的白名单。
- 用的是「整条历史的 ATH」，不是「卖出之后的峰值」。所以有的代币 ATH 在你卖出之前就已经发生，这种「卖飞」数字会偏小甚至为负，自动排在真正纸手的代币之后。
- 「卖飞金额」= 同等数量在 ATH 的美元价值 − 你当时实际拿到。本身就是个夸张的口径——没人真的卖在最高点。首页明确说明了这一点。

## 协议

MIT。
