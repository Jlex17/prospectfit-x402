# ProspectFit x402

A small pay-per-call API for AI/sales agents. The paid endpoint accepts prospect context and returns a structured fit score, likely needs, discovery questions, an opening angle, and cross-sell paths.

This is an MVP designed to prove the x402 payment + discovery flow before spending money on richer data sources.

## What is paid

`GET /api/prospect-brief` — default price: **$0.02 per successful call**.

Example inputs:

- `company` (required)
- `industry`
- `employees`
- `city`
- `state`
- `pain`

The output is explicitly heuristic. It does **not** pretend to have independently researched the company.

## Requirements

- Node.js 22+
- Coinbase Developer Platform API key ID + secret
- CDP wallet secret

## 1. Configure

```bash
cp .env.example .env
```

Fill in:

```bash
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
CDP_WALLET_SECRET=...
X402_ENVIRONMENT=development
X402_PRICE=$0.02
```

Keep development mode on first. Do not commit `.env`.

## 2. Install and test

```bash
npm install
npm run test:logic
npm run check
npm start
```

Free health check:

```bash
curl -i http://localhost:8402/health
```

Try the paid route without payment:

```bash
curl -i "http://localhost:8402/api/prospect-brief?company=Acme%20Logistics&industry=transportation&employees=250&city=Bakersfield&state=CA&pain=fleet%20connectivity"
```

A correctly configured x402 server should respond with **HTTP 402 Payment Required** and a `PAYMENT-REQUIRED` header.

## 3. Deploy

Deploy this Node/Docker app to any host that gives you a stable public **HTTPS** URL. Set the same environment variables in the host's secret/environment settings.

Keep `X402_ENVIRONMENT=development` until you have successfully tested the public URL.

## 4. Validate discovery

Once the endpoint is public, validate it with CDP's x402 validator:

```bash
curl -X POST https://api.cdp.coinbase.com/platform/v2/x402/validate \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "https://YOUR-DOMAIN/api/prospect-brief?company=Acme",
    "method": "GET"
  }'
```

Look for `valid: true` and an accepted simulation result.

## 5. Trigger Bazaar indexing

CDP's current discovery flow requires a **successful paid call** through the CDP Facilitator after the endpoint is deployed and has valid Bazaar metadata. The TypeScript `createX402Server` path automatically enables Bazaar support for declared routes, and this project adds explicit input/output discovery metadata.

## 6. Go live

Only after testnet works:

```bash
X402_ENVIRONMENT=production
```

Redeploy. Production uses mainnet/real funds. Start with the low price and confirm real settlement before changing pricing.

## 7. Add to x402scan

Use x402scan's **Add API / Register Resource** flow with the public paid endpoint or server URL. x402scan is a community explorer/directory separate from CDP Bazaar, so treat registration there as an additional distribution step.

## Good first metrics

Do not judge this by raw transaction count alone. Track:

1. settled USDC revenue,
2. unique paying wallets/buyers,
3. paid calls per buyer,
4. uptime/error rate,
5. which query types repeat.

If buyers use it, the next version should add actual public/company data enrichment and/or an LLM-generated brief. If nobody uses it, change the product before adding operating cost.

## Important limitations

- No revenue is guaranteed.
- The fit score is a transparent heuristic based only on request inputs.
- Do not market the output as verified intelligence.
- Crypto/stablecoin payments can have tax, accounting, and regulatory implications; keep transaction records and get professional advice where appropriate.
