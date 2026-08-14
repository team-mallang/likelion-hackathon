import { evaluateSanitizer } from "./evaluate.ts";
import { HOLDOUT_FIXTURES } from "./holdout-dataset.ts";
import { createSanitizers } from "./sanitizers.ts";

async function main() {
  const sanitizer = createSanitizers().find((candidate) => candidate.name.includes("contextual"));
  if (!sanitizer) throw new Error("Korean contextual sanitizer is unavailable");
  const summary = await evaluateSanitizer(sanitizer, HOLDOUT_FIXTURES);
  console.log(`Hold-out fixtures: ${summary.totalFixtures}`);
  console.log(`Expected entities: ${summary.expectedEntities}`);
  console.log(`Detection: ${summary.detectedEntities}/${summary.expectedEntities}`);
  console.log(`False negatives: ${summary.falseNegatives}`);
  console.log(`Non-PII preservation: ${summary.nonPiiPreserved}/${summary.nonPiiTotal}`);
  console.log(`False-positive fixtures: ${summary.falsePositiveFixtures}`);
  console.log(`Average: ${summary.averageMs.toFixed(3)}ms`);
  console.log(`Maximum: ${Math.max(...summary.results.map((result) => result.elapsedMs)).toFixed(3)}ms`);
  for (const [label, predicate] of [
    ["Incident Intake", (id: string) => id.startsWith("h-mixed-")],
    ["Live Assistance", (id: string) => id.startsWith("h-live-")],
  ] as const) {
    const subset = HOLDOUT_FIXTURES.filter((fixture) => predicate(fixture.id));
    const subsetSummary = await evaluateSanitizer(sanitizer, subset);
    console.log(`${label}: ${subsetSummary.detectedEntities}/${subsetSummary.expectedEntities}, FP ${subsetSummary.falsePositiveFixtures}, avg ${subsetSummary.averageMs.toFixed(3)}ms, max ${Math.max(...subsetSummary.results.map((result) => result.elapsedMs)).toFixed(3)}ms`);
  }
  for (const [category, score] of Object.entries(summary.categories)) console.log(`${category}: ${score.detected}/${score.expected}`);
  for (const result of summary.results.filter((entry) => entry.status !== "PASS")) {
    console.log(`\n[${result.status}] ${result.fixture.id}`);
    console.log(`EXPECTED ${result.expectedMasked}`);
    console.log(`ACTUAL   ${result.actualMasked}`);
  }
}

void main();
