import { evaluateSanitizer } from "./evaluate.ts";
import { createSanitizers } from "./sanitizers.ts";

async function main() {
 for (const sanitizer of createSanitizers()) {
  const summary = await evaluateSanitizer(sanitizer);
  console.log(`\n${"=".repeat(72)}`);
  console.log(`${summary.sanitizer} (${summary.version})`);
  console.log(`${"=".repeat(72)}`);
  console.log(`PII Detection: ${summary.detectedEntities} / ${summary.expectedEntities}`);
  console.log(`False Negative: ${summary.falseNegatives}`);
  console.log(`Non-PII Preservation: ${summary.nonPiiPreserved} / ${summary.nonPiiTotal}`);
  console.log(`False Positive fixtures: ${summary.falsePositiveFixtures}`);
  console.log(`Average processing time: ${summary.averageMs.toFixed(3)}ms`);
  console.log("Categories:");
  for (const [category, score] of Object.entries(summary.categories)) {
    console.log(`  ${category.padEnd(15)} ${score.detected}/${score.expected}`);
  }
  for (const result of summary.results.filter((entry) => entry.status !== "PASS")) {
    console.log(`\n[${result.status}] ${result.fixture.id}`);
    console.log(`INPUT    ${result.fixture.input}`);
    console.log(`EXPECTED ${result.expectedMasked}`);
    console.log(`ACTUAL   ${result.actualMasked}`);
  }
 }
}

void main();
