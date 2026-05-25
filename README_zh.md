# 纸手日报 · Paperhand Gazette

> 一份只为「卖飞」而办的报纸。
>
> imToken 十周年 AI 共创活动作品 —— 单页链上小报，挖出你最大的一次「纸手」卖出，给它印一份维多利亚式讣告。

**🏆 imToken 十周年 AI 共创活动获奖作品**
**二等奖 + 专项奖**

> *本仓库已封存，不再主动维护。Demo 保持在线。*

- 在线体验：https://paperhand-gazette.vercel.app
- 仓库：https://github.com/gunksd/paperhand-gazette
- English README：[README.md](./README.md)

## 它做什么

1. 连接钱包（只读，EIP-1193 / EIP-6963）。
2. 从 Etherscan v2 拉取该地址全部 ERC-20 转账。
3. 按代币识别真正的 **「先买后卖到 DEX」** 事件（详见下面「检测逻辑」）。普通转账、跨链桥、CEX 充值、稳定币全部排除。
4. 通过 GoPlus token-security 过滤掉貔貅、黑名单、卖出税>10%、不可卖、非开源的合约。
5. 对每个幸存代币，从 CoinGecko `market_chart/range` 拿 **「第一次买入之后」的最高价**（失败时回退到 lifetime ATH）。如果买入后峰值 ≤ 卖出价，则丢弃 —— 这种没有真正的卖飞故事。
6. 算 `卖飞美元 = 卖出数量 × 买入后峰值 − 实际拿到`，排序。
7. 把最大的一笔做成头版讣告，其它的做成副讣告。

特殊版面：

- **Clean Hands 版**：钱包没有任何符合条件的纸手卖出（或全部被过滤）。会替换为「无讣告可印」的安静版面。
- **Sample 版**：不连钱包也能预览一份示例。

## 检测逻辑

我们要找的是「真正的纸手」，而不是任意一笔出账。一个代币只有同时满足下面三条才会被计入：

1. **你先买过它**：该代币的第一笔 IN 必须早于任何符合条件的 OUT（`firstSeen` = 第一次买入时间）。
2. **OUT 是 swap，不是转账**。满足下列任一条件就算 swap：
   - 目的地址是已知的 DEX 路由器（Uniswap V2 / V3 / Universal Router / V4、SushiSwap、PancakeSwap Smart/V3/V2、1inch V5/V6、0x、Paraswap V5/V6、CowSwap GPv2、Permit2），**或**
   - 同一笔 tx hash 里你也收到了**另一种**代币（原子 swap 的通用特征——能覆盖 Uniswap V2/V3 池子直发的情况，那时 `to` 是池子地址不在路由白名单里；也能覆盖任何聚合器的多池分单）。
3. **不是稳定币**。硬合约名单（USDC / USDT / DAI / BUSD / TUSD / USDP / FRAX / LUSD / PYUSD / sUSD / GUSD / EURS / EURT），加上 `^USD*` / `^EUR*` 前缀的符号兜底。

这套逻辑能在不维护「池子地址全集」的前提下抓到所有 Uniswap-style AMM 上的真实卖出，同时把钱包之间转账、跨链、CEX 充值、转给朋友的全部排除。

## 技术栈

| 层 | 选型 | 原因 |
|---|---|---|
| 前端 | 单文件 `index.html` + ethers v6 + qrcodejs + html2canvas | 无构建。所有钱包内置浏览器都跑得起来。 |
| 后端 | Vercel serverless（`/api/*`） | 隐藏 API key；加 CDN 缓存（`s-maxage`）。 |
| 钱包 | EIP-1193 + EIP-6963 + 异步注入等待 + `wallet_requestPermissions` 强制重新弹窗 | imToken / Coinbase / Rabby 是异步注入的，首屏点按钮会抢跑。 |
| 链上数据 | Etherscan v2 multichain（`chainid=1`，最新 1 万条 tokentx） | 免费，覆盖完整 ERC-20 历史，且能在 serverless 时间预算内返回。 |
| 价格 | CoinGecko 免费 API + Demo Key | lifetime ATH、卖出当日历史价、`market_chart/range` 拿「买入后峰值」。 |
| 安全 | GoPlus `token_security/1` | 免费貔貅/诈骗特征识别。 |
| 分享 | html2canvas → PNG，1080×1350 屏幕外固定卡片 | gmgn 风格深色卡片，地址打码（`0xab12…cd34`）+ 二维码；可下载 / 复制到剪贴板 / 系统分享。 |
| 国际化 | 原生 `data-i18n` + `LANG` 字典 | 英文 / 中文。 |

## API 路由

所有都通过 Vercel serverless 代理，浏览器拿不到任何 key。

- `GET /api/transfers?addr=0x…` — Etherscan v2 ERC-20 历史（`maxDuration=30`，`s-maxage=300`）
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

- **右上角钱包徽章** —— 常驻。未连接时显示灰点 + 「连接钱包」，点击即连。连接后变绿点 + 短地址，点地址复制完整地址，点「断开」吊销授权。
- **桌面 + MetaMask / Rabby** —— 打开链接，点「读我的讣告」（或徽章），授权连接。
- **手机 imToken** —— 用 imToken 内置浏览器打开链接，或扫描桌面端二维码，点「读我的讣告」。
- **不连钱包** —— 点「看一份样本」预览（PEPE / SOL / SHIB / LINK / RNDR / INJ）。
- 看完讣告点「分享我的讣告」生成 1080×1350 的 PNG 卡片，可下载 / 复制到剪贴板 / 系统分享。图片里地址打码为 `0xab12…cd34`。
- 点「换一个钱包试试」回到首页连接新地址。

## 已知限制

- 「峰值」是从 CoinGecko `market_chart/range` 取的、第一次买入之后日级别的最高价。若该调用失败或返回空，回退到 lifetime ATH。无论哪种，这都是「机会价格」，不是真实成交价 —— 没人卖在最高点。
- 「卖飞金额」= 同等数量在「买入后峰值」的美元价值 − 你当时实际拿到。本身就是个夸张的口径。首页明确说明了这一点。
- Etherscan 单次最多返回最新 1 万条 ERC-20 转账记录。极度活跃的钱包早期历史会被截断。
- 检测是基于启发式的，并没有解析合约层面的 swap log。「同笔 tx 跨币种」启发对 AMM swap 很可靠，但可能漏掉一些奇异路径（比如经过你钱包的多跳交易、手续费返还）。

## 协议

MIT。
