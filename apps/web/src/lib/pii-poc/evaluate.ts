import { performance } from "node:perf_hooks";

import { PII_FIXTURES } from "./dataset.ts";
import type { ExpectedEntity, PiiCategory, PiiFixture, Sanitizer, SanitizerDetection } from "./types.ts";

type FixtureResult = {
  fixture: PiiFixture;
  expectedMasked: string;
  actualMasked: string;
  status: "PASS" | "FALSE_NEGATIVE" | "FALSE_POSITIVE" | "MISMATCH";
  elapsedMs: number;
};

export type EvaluationSummary = {
  sanitizer: string;
  version: string;
  totalFixtures: number;
  expectedEntities: number;
  detectedEntities: number;
  falseNegatives: number;
  falsePositiveFixtures: number;
  nonPiiPreserved: number;
  nonPiiTotal: number;
  averageMs: number;
  categories: Record<PiiCategory, { detected: number; expected: number }>;
  results: FixtureResult[];
};

function expectedDetections(fixture: PiiFixture): SanitizerDetection[] {
  const used = new Set<number>();
  return fixture.entities.map((entity) => {
    let start = fixture.input.indexOf(entity.value);
    while (used.has(start) && start >= 0) start = fixture.input.indexOf(entity.value, start + 1);
    if (start < 0) throw new Error(`Fixture ${fixture.id} does not contain ${entity.value}`);
    used.add(start);
    return { ...entity, start, end: start + entity.value.length };
  });
}

function mask(text: string, detections: SanitizerDetection[]): string {
  return [...detections].sort((a, b) => b.start - a.start)
    .reduce((result, item) => `${result.slice(0, item.start)}[${item.category}]${result.slice(item.end)}`, text);
}

function sameEntity(expected: ExpectedEntity, actual: SanitizerDetection): boolean {
  return expected.category === actual.category && expected.value === actual.value;
}

const CATEGORIES: PiiCategory[] = ["NAME", "PHONE_NUMBER", "EMAIL", "PASSPORT", "RRN", "CARD_NUMBER", "BANK_ACCOUNT"];

export async function evaluateSanitizer(sanitizer: Sanitizer, fixtures: PiiFixture[] = PII_FIXTURES): Promise<EvaluationSummary> {
  const results: FixtureResult[] = [];
  const categories = Object.fromEntries(CATEGORIES.map((category) => [category, { detected: 0, expected: 0 }])) as EvaluationSummary["categories"];
  let detectedEntities = 0;
  let falseNegatives = 0;
  let falsePositiveFixtures = 0;
  let nonPiiPreserved = 0;

  for (const fixture of fixtures) {
    const expected = expectedDetections(fixture);
    const started = performance.now();
    const actual = await sanitizer.sanitize(fixture.input);
    const elapsedMs = performance.now() - started;
    const matched = fixture.entities.filter((entity) => actual.detections.some((detection) => sameEntity(entity, detection)));
    const unexpected = actual.detections.filter((detection) => !fixture.entities.some((entity) => sameEntity(entity, detection)));
    const missed = fixture.entities.length - matched.length;
    detectedEntities += matched.length;
    falseNegatives += missed;
    for (const entity of fixture.entities) categories[entity.category].expected += 1;
    for (const entity of matched) categories[entity.category].detected += 1;

    const falsePositive = unexpected.length > 0;
    if (falsePositive) falsePositiveFixtures += 1;
    if (fixture.group === "NON_PII" && !falsePositive && actual.masked === fixture.input) nonPiiPreserved += 1;
    const status = missed > 0 && falsePositive ? "MISMATCH" : missed > 0 ? "FALSE_NEGATIVE" : falsePositive ? "FALSE_POSITIVE" : "PASS";
    results.push({ fixture, expectedMasked: mask(fixture.input, expected), actualMasked: actual.masked, status, elapsedMs });
  }

  return {
    sanitizer: sanitizer.name, version: sanitizer.version, totalFixtures: fixtures.length,
    expectedEntities: fixtures.reduce((sum, fixture) => sum + fixture.entities.length, 0),
    detectedEntities, falseNegatives, falsePositiveFixtures, nonPiiPreserved,
    nonPiiTotal: fixtures.filter((fixture) => fixture.group === "NON_PII").length,
    averageMs: results.reduce((sum, result) => sum + result.elapsedMs, 0) / results.length,
    categories, results,
  };
}
