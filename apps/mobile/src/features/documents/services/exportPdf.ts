import type { PreviousCaseCard } from "@/features/case-card/types/caseCard";
import type {
  PoliceReportDraft,
  PoliceReportField,
  PoliceReportItem,
  PoliceReportLanguage,
} from "@/features/police-report/types/policeReport";

export type GeneratedExportPdfs = {
  policeReportUri: string;
  caseCardUri: string;
};

const MISSING = "미입력";
const APPLICANT_REQUIRED = "현장 기입 필요";

export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function text(value: string | null | undefined, fallback = MISSING) {
  const trimmed = value?.trim();
  return escapeHtml(trimmed || fallback);
}

function localized(value: { ja: string; ko: string }, language: "ja" | "ko" = "ja") {
  return value[language].trim() || value.ko.trim() || value.ja.trim();
}

function documentShell(title: string, body: string, language: PoliceReportLanguage = "ja") {
  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
@page { size: A4 portrait; margin: 14mm 12mm; }
* { box-sizing: border-box; }
body { margin: 0; color: #111; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans JP", "Yu Gothic", sans-serif; font-size: 10pt; line-height: 1.45; }
h1 { margin: 0; font-size: 22pt; letter-spacing: .08em; text-align: center; }
h2 { margin: 0; font-size: 12pt; }
.subtitle { margin: 2mm 0 7mm; color: #444; text-align: center; font-size: 9pt; }
.section { margin-top: 5mm; break-inside: avoid; }
.section-title { padding: 2mm 2.5mm; border: .4pt solid #555; border-bottom: 0; font-weight: 700; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
th, td { padding: 2.2mm 2.5mm; border: .4pt solid #555; vertical-align: top; overflow-wrap: anywhere; word-break: break-word; }
th { width: 24%; background: #f5f5f5; text-align: left; font-weight: 700; }
th small { display: block; color: #555; font-size: 8pt; font-weight: 400; }
.wide-label { width: 24%; }
.narrative { min-height: 28mm; white-space: pre-wrap; }
.item { margin-top: 4mm; break-inside: avoid; }
.item-title { padding: 2mm 2.5mm; border: .4pt solid #555; border-bottom: 0; font-weight: 700; }
.item-title small { margin-left: 2mm; color: #555; font-weight: 400; }
.muted { color: #555; }
.case-number { margin-top: 3mm; text-align: right; font-size: 9pt; }
.page-break { break-before: page; }
</style>
</head>
<body>${body}</body>
</html>`;
}

function fieldRows(
  fields: PoliceReportField[],
  applicant: boolean,
  language: PoliceReportLanguage,
) {
  return fields.map((field) => {
    const secondaryLanguage = language === "ja" ? "ko" : "ja";
    const label = text(field.label[language], field.id);
    const secondaryLabel = text(field.label[secondaryLanguage]);
    const value = text(
      localized(field.value, language),
      applicant ? APPLICANT_REQUIRED : MISSING,
    );
    return `<tr><th>${label}<small>${secondaryLabel}</small></th><td>${value}</td></tr>`;
  }).join("");
}

function itemRows(item: PoliceReportItem, language: PoliceReportLanguage) {
  return item.details.map((detail) => {
    const secondaryLanguage = language === "ja" ? "ko" : "ja";
    const parts = detail.text[language].split(": ");
    const secondaryParts = detail.text[secondaryLanguage].split(": ");
    const label = parts.length > 1 ? parts.shift() ?? detail.id : detail.id;
    const value = parts.length > 0
      ? parts.join(": ")
      : localized(detail.text, language);
    const secondaryLabel = secondaryParts.length > 1
      ? secondaryParts.shift() ?? detail.id
      : detail.id;
    return `<tr><th>${text(label, detail.id)}<small>${text(secondaryLabel)}</small></th><td>${text(value)}</td></tr>`;
  }).join("");
}

function reportTitle(caseType: PoliceReportDraft["caseType"]) {
  if (caseType === "STOLEN") return ["盗難被害 申告情報", "도난 신고 정보 정리"];
  if (caseType === "UNKNOWN") return ["警察申告用 情報整理", "경찰 신고용 정보 정리"];
  return ["遺失届", "분실 신고서 초안"];
}

export function buildPoliceReportHtml(
  draft: PoliceReportDraft,
  language: PoliceReportLanguage = "ja",
): string {
  const [titleJa, titleKo] = reportTitle(draft.caseType);
  const isKorean = language === "ko";
  const title = isKorean ? titleKo : titleJa;
  const secondaryTitle = isKorean ? titleJa : titleKo;
  const sectionTitle = (ja: string, ko: string) =>
    isKorean
      ? `${ko} <span class="muted">/ ${ja}</span>`
      : `${ja} <span class="muted">/ ${ko}</span>`;
  const applicant = `<div class="section"><div class="section-title">${sectionTitle("申告者情報", "신고자 정보")}</div><table>${fieldRows(draft.applicantFields, true, language)}</table></div>`;
  const incident = `<div class="section"><div class="section-title">${sectionTitle("事件情報", "사건 정보")}</div><table>${fieldRows(draft.incidentFields, false, language)}</table></div>`;
  const narrative = `<div class="section"><div class="section-title">${sectionTitle("遺失状況", "분실 경위")}</div><table><tr><td class="narrative">${text(localized(draft.narrative, language))}</td></tr></table></div>`;
  const items = draft.items.length === 0
    ? `<div class="section"><div class="section-title">${sectionTitle("遺失物", "분실 물품")}</div><table><tr><td>${MISSING}</td></tr></table></div>`
    : `<div class="section"><div class="section-title">${sectionTitle("遺失物", "분실 물품")}</div>${draft.items.map((item, index) => `<div class="item"><div class="item-title">${isKorean ? "분실 물품" : "遺失物"} ${index + 1}<small>/ ${isKorean ? "遺失物" : "분실 물품"} ${index + 1}</small></div><table><tr><th>${isKorean ? "물품명" : "品名"}<small>${isKorean ? "品名" : "물품명"}</small></th><td>${text(localized(item.title, language))}</td></tr>${itemRows(item, language) || `<tr><th>${isKorean ? "상세 정보" : "詳細"}<small>${isKorean ? "詳細" : "상세 정보"}</small></th><td>${MISSING}</td></tr>`}</table></div>`).join("")}</div>`;
  const description = isKorean
    ? "일본어 제출용 초안의 내용을 확인하기 위한 한국어 확인본입니다."
    : "입력한 사건 정보를 바탕으로 작성된 참고용 초안입니다.";
  return documentShell(title, `<h1>${escapeHtml(title)}</h1><div class="subtitle">${escapeHtml(secondaryTitle)}<br />${description}</div>${applicant}${incident}${narrative}${items}`, language);
}

function caseItemRows(caseCard: PreviousCaseCard) {
  if (caseCard.lostItems.length === 0) return `<tr><td>${MISSING}</td></tr>`;
  return caseCard.lostItems.map((item, index) => `<tr><th>${index + 1}. ${text(item.title)}</th><td>${text(item.description)}</td></tr>`).join("");
}

export function buildCaseCardHtml(caseCard: PreviousCaseCard): string {
  const incidentRows = [
    ["사건 유형", caseCard.incidentTypeLabel],
    ["진행 상태", caseCard.reportStatusLabel],
    ["사건 일시", caseCard.occurredAt],
    ["사건 장소", caseCard.locationLabel],
    ["AI 요약", caseCard.aiSummary],
    ["사건 설명", caseCard.description],
    ["최초 진술", caseCard.initialStatement],
  ].map(([label, value]) => `<tr><th>${text(label)}</th><td>${text(value)}</td></tr>`).join("");
  const details = caseCard.incidentDetails.length === 0
    ? `<tr><td>${MISSING}</td></tr>`
    : caseCard.incidentDetails.map((detail) => `<tr><th>${text(detail.label)}</th><td>${text(detail.value)}</td></tr>`).join("");
  const body = `<h1>사건 카드</h1><div class="case-number">사건번호: ${text(caseCard.caseNumber)}</div><div class="section"><div class="section-title">사건 정보</div><table>${incidentRows}</table></div><div class="section"><div class="section-title">분실 물품</div><table>${caseItemRows(caseCard)}</table></div><div class="section"><div class="section-title">추가 사건 정보</div><table>${details}</table></div>`;
  return documentShell("사건 카드", body);
}
