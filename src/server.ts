import "dotenv/config";
import express, { type Request } from "express";
import { createX402Server } from "@coinbase/cdp-sdk/x402";
import { paymentMiddlewareFromHTTPServer } from "@x402/express";
import { declareDiscoveryExtension } from "@x402/extensions/bazaar";
import { buildProspectBrief } from "./logic.js";

const app = express();
const port = Number(process.env.PORT ?? 8402);
const price = process.env.X402_PRICE ?? "$0.02";
const environment = process.env.X402_ENVIRONMENT === "production" ? "production" : "development";

function queryString(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function queryNumber(req: Request, key: string): number | undefined {
  const raw = queryString(req, key);
  if (!raw) return undefined;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

const x402Server = await createX402Server({
  environment,
  routes: {
    "GET /api/prospect-brief": {
      price,
      description:
        "Score a B2B prospect from supplied company context and return structured sales angles, likely needs, discovery questions, and cross-sell paths. Use for sales-agent prioritization; output is heuristic, not independently verified company research.",
      extensions: {
        ...declareDiscoveryExtension({
          input: {
            company: "Acme Logistics",
            industry: "transportation",
            employees: 250,
            city: "Bakersfield",
            state: "CA",
            pain: "fleet connectivity and dispatch outages"
          },
          inputSchema: {
            properties: {
              company: { type: "string", description: "Company or prospect name" },
              industry: { type: "string", description: "Optional industry or vertical" },
              employees: { type: "number", description: "Optional approximate employee count" },
              city: { type: "string", description: "Optional city" },
              state: { type: "string", description: "Optional state/region" },
              pain: { type: "string", description: "Optional known business pain or trigger" }
            },
            required: ["company"]
          },
          output: {
            example: {
              company: "Acme Logistics",
              fitScore: 90,
              priorityTier: "A",
              probableNeeds: ["Fleet visibility, telematics, routing, and mobile connectivity"],
              openingAngle: "Lead with operational efficiency and quantify downtime.",
              discoveryQuestions: ["How many employees, locations, vehicles, and mobile devices are in scope today?"],
              crossSellPaths: ["Fleet/telematics + tablets/phones + connectivity"],
              basis: ["100–499 employees: +20"],
              disclaimer: "Heuristic output based on supplied fields."
            }
          }
        })
      }
    }
  }
});

// x402 middleware protects only the route declared above. Free routes remain open.
app.use(paymentMiddlewareFromHTTPServer(x402Server));

app.get("/", (_req, res) => {
  res.json({
    name: "ProspectFit x402",
    version: "0.1.0",
    description: "Pay-per-call B2B prospect scoring for AI and sales agents.",
    paidEndpoint: "/api/prospect-brief",
    price,
    environment,
    docs: "/openapi.json"
  });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "prospectfit-x402", environment });
});

app.get("/openapi.json", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  res.json({
    openapi: "3.1.0",
    info: {
      title: "ProspectFit x402 API",
      version: "0.1.0",
      description: "Paid B2B prospect-fit scoring endpoint using x402."
    },
    servers: [{ url: baseUrl }],
    paths: {
      "/api/prospect-brief": {
        get: {
          summary: "Generate a structured B2B prospect brief",
          parameters: [
            { name: "company", in: "query", required: true, schema: { type: "string" } },
            { name: "industry", in: "query", required: false, schema: { type: "string" } },
            { name: "employees", in: "query", required: false, schema: { type: "number", minimum: 0 } },
            { name: "city", in: "query", required: false, schema: { type: "string" } },
            { name: "state", in: "query", required: false, schema: { type: "string" } },
            { name: "pain", in: "query", required: false, schema: { type: "string" } }
          ],
          responses: {
            "200": { description: "Paid request succeeded" },
            "400": { description: "Missing or invalid request data" },
            "402": { description: "Payment required; inspect PAYMENT-REQUIRED header" }
          }
        }
      }
    }
  });
});

app.get("/api/prospect-brief", (req, res) => {
  const company = queryString(req, "company");
  if (!company) {
    return res.status(400).json({ error: "company query parameter is required" });
  }

  const employees = queryNumber(req, "employees");
  if (employees !== undefined && employees < 0) {
    return res.status(400).json({ error: "employees must be zero or greater" });
  }

  return res.json(
    buildProspectBrief({
      company,
      industry: queryString(req, "industry"),
      employees,
      city: queryString(req, "city"),
      state: queryString(req, "state"),
      pain: queryString(req, "pain")
    })
  );
});

app.listen(port, "0.0.0.0", () => {
  console.log(`ProspectFit x402 listening on port ${port}`);
  console.log(`Environment: ${environment}`);
  console.log(`Price: ${price} per successful paid call`);
  console.log(`EVM receiving address: ${x402Server.payToEvmAddress}`);
});
