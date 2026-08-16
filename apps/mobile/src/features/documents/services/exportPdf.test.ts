import assert from "node:assert/strict";
import { test } from "node:test";

import { buildCaseCardHtml, buildPoliceReportHtml, escapeHtml } from "./exportPdf";
import type { PreviousCaseCard } from "@/features/case-card/types/caseCard";
import type { PoliceReportDraft } from "@/features/police-report/types/policeReport";

const baseDraft = (caseType: PoliceReportDraft["caseType"]): PoliceReportDraft => ({
  draftId: "draft-1",
  caseId: "case-1",
  version: 1,
  sourceRevision: "case-api",
  status: "READY",
  source: "CASE_CARD",
  caseType,
  applicantFields: [{ id: "name", label: { ja: "氏名", ko: "성명" }, value: { ja: "", ko: "" }, required: true, missing: true }],
  incidentFields: [{ id: "place", label: { ja: "遺失場所", ko: "분실 장소" }, value: { ja: "카페 <A>", ko: "카페 <A>" }, required: false, missing: false }],
  items: [{ id: "item-1", order: 0, title: { ja: "財布", ko: "지갑" }, details: [{ id: "last_seen_place", text: { ja: "最後に確認した場所: 新宿カフェ", ko: "마지막 확인 장소: 신주쿠 카페" } }] }],
  narrative: { ja: "긴 경위 & <상세>", ko: "긴 경위 & <상세>" },
  missingFieldIds: ["name"],
});

const caseCard: PreviousCaseCard = {
  caseId: "case-1",
  caseNumber: "CASE-001",
  reportStatusLabel: "신고 완료",
  title: "분실 사건",
  incidentTypeLabel: "분실",
  occurredAt: "2026-08-16T18:30:00.000Z",
  locationLabel: "카페 <A>",
  aiSummary: "요약 & 설명",
  aiSummaryStatus: "READY",
  lostItems: [
    { id: "item-1", title: "지갑", description: "검정색 & 가죽" },
    { id: "item-2", title: "열쇠", description: "금속" },
  ],
  description: "사건 설명",
  initialStatement: "최초 진술",
  incidentDetails: [{ label: "마지막 확인 장소", value: "신주쿠 카페" }],
};

test("escapeHtml escapes HTML-sensitive characters", () => {
  assert.equal(escapeHtml(`<&>\"'`), "&lt;&amp;&gt;&quot;&#39;");
});

test("police report HTML uses case-type titles and safe missing values", () => {
  for (const [caseType, title] of [["LOST", "遺失届"], ["STOLEN", "盗難被害 申告情報"], ["UNKNOWN", "警察申告用 情報整理"]] as const) {
    const html = buildPoliceReportHtml(baseDraft(caseType));
    assert.match(html, new RegExp(title));
    assert.match(html, /현장 기입 필요/);
    assert.match(html, /마지막 확인 장소/);
    assert.doesNotMatch(html, /카페 <A>/);
    assert.match(html, /카페 &lt;A&gt;/);
  }
});

test("police report HTML renders long narrative and multiple items without internal credentials", () => {
  const html = buildPoliceReportHtml(baseDraft("LOST"));
  assert.match(html, /긴 경위 &amp; &lt;상세&gt;/);
  assert.match(html, /遺失物 1/);
  assert.doesNotMatch(html, /accessToken|Bearer|OPENAI_API_KEY/);
});

test("case card HTML includes case details and multiple items safely", () => {
  const html = buildCaseCardHtml(caseCard);
  assert.match(html, /CASE-001/);
  assert.match(html, /신주쿠 카페/);
  assert.match(html, /지갑/);
  assert.match(html, /열쇠/);
  assert.match(html, /카페 &lt;A&gt;/);
});
