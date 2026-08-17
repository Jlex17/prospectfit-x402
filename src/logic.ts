export type ProspectInput = {
  company: string;
  industry?: string;
  employees?: number;
  city?: string;
  state?: string;
  pain?: string;
};

export type ProspectBrief = {
  company: string;
  fitScore: number;
  priorityTier: "A" | "B" | "C";
  probableNeeds: string[];
  openingAngle: string;
  discoveryQuestions: string[];
  crossSellPaths: string[];
  basis: string[];
  disclaimer: string;
};

const FIELD_HEAVY = [
  "transportation",
  "trucking",
  "logistics",
  "construction",
  "agriculture",
  "farming",
  "field service",
  "healthcare",
  "manufacturing",
  "utilities",
  "public safety",
  "hospitality",
  "retail"
];

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(word));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function buildProspectBrief(input: ProspectInput): ProspectBrief {
  const company = input.company.trim();
  const industry = (input.industry ?? "").trim().toLowerCase();
  const pain = (input.pain ?? "").trim().toLowerCase();
  const location = [input.city, input.state].filter(Boolean).join(", ");
  const employees = Number.isFinite(input.employees) ? Math.max(0, input.employees ?? 0) : 0;

  let score = 35;
  const basis: string[] = ["Base B2B prospect score: 35"];

  if (employees >= 500) {
    score += 25;
    basis.push("500+ employees: +25");
  } else if (employees >= 100) {
    score += 20;
    basis.push("100–499 employees: +20");
  } else if (employees >= 25) {
    score += 12;
    basis.push("25–99 employees: +12");
  } else if (employees > 0) {
    score += 5;
    basis.push("1–24 employees: +5");
  }

  if (industry && hasAny(industry, FIELD_HEAVY)) {
    score += 15;
    basis.push("Field-heavy / distributed industry: +15");
  } else if (industry) {
    score += 7;
    basis.push("Industry supplied: +7");
  }

  if (pain) {
    score += 15;
    basis.push("Explicit business pain supplied: +15");
  }

  if (location) {
    score += 5;
    basis.push("Location supplied: +5");
  }

  score = clamp(score, 0, 100);
  const priorityTier: "A" | "B" | "C" = score >= 75 ? "A" : score >= 55 ? "B" : "C";

  const combined = `${industry} ${pain}`;
  const needs = new Set<string>();

  if (hasAny(combined, ["fleet", "truck", "driver", "vehicle", "route", "dispatch", "logistics", "transportation"])) {
    needs.add("Fleet visibility, telematics, routing, and mobile connectivity");
  }
  if (hasAny(combined, ["field", "construction", "jobsite", "agriculture", "farm", "remote", "crew"])) {
    needs.add("Reliable field connectivity and managed mobile devices");
  }
  if (hasAny(combined, ["security", "breach", "phishing", "cyber", "mdm", "device", "compliance"])) {
    needs.add("Endpoint/device management and security controls");
  }
  if (hasAny(combined, ["call", "phone", "voice", "contact center", "teams", "dialpad", "communications"])) {
    needs.add("Unified communications, voice, and collaboration");
  }
  if (hasAny(combined, ["internet", "outage", "backup", "failover", "connectivity", "broadband", "wan"])) {
    needs.add("Primary/backup internet and business continuity connectivity");
  }

  if (needs.size === 0) {
    needs.add("Mobility cost optimization and device lifecycle management");
    needs.add("Business continuity and connectivity review");
  }

  const probableNeeds = Array.from(needs);
  const leadContext = industry ? ` in ${input.industry}` : "";
  const locationContext = location ? ` around ${location}` : "";
  const painContext = input.pain ? `, especially around ${input.pain}` : "";

  const openingAngle = `${company}${leadContext}${locationContext} looks like a ${priorityTier}-tier prospect based on the supplied operating profile${painContext}. Lead with a short operational-efficiency conversation, then quantify downtime, device, connectivity, or workflow costs before proposing products.`;

  const discoveryQuestions = [
    "How many employees, locations, vehicles, and mobile devices are in scope today?",
    "Where do connectivity, device, or communication failures create the most operational downtime?",
    "What are you currently spending across wireless, internet, voice, fleet, and device-management vendors?",
    "Which workflows still depend on manual handoffs, personal phones, spreadsheets, or disconnected systems?",
    "Is there a contract, renewal, expansion, seasonal ramp, or compliance event creating a decision window?"
  ];

  const crossSellPaths = [
    "Wireless + device refresh + MDM/security",
    "Business internet + wireless failover",
    "Fleet/telematics + tablets/phones + connectivity",
    "Voice/collaboration + mobility",
    "Security review + managed connectivity"
  ];

  return {
    company,
    fitScore: score,
    priorityTier,
    probableNeeds,
    openingAngle,
    discoveryQuestions,
    crossSellPaths,
    basis,
    disclaimer:
      "This is a heuristic sales-planning output based only on fields supplied in the request. It is not verified company intelligence and should not be represented as factual research about the prospect."
  };
}
