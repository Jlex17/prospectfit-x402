import assert from "node:assert/strict";
import { buildProspectBrief } from "./logic.js";

const strong = buildProspectBrief({
  company: "Acme Logistics",
  industry: "transportation and logistics",
  employees: 250,
  city: "Bakersfield",
  state: "CA",
  pain: "fleet connectivity and dispatch outages"
});

assert.equal(strong.priorityTier, "A");
assert.ok(strong.fitScore >= 75);
assert.ok(strong.probableNeeds.some((x) => x.toLowerCase().includes("fleet")));

const small = buildProspectBrief({ company: "Tiny Co", employees: 5 });
assert.ok(small.fitScore < strong.fitScore);
assert.equal(small.company, "Tiny Co");

console.log("logic tests passed");
