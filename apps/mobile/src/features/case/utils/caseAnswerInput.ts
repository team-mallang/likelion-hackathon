import type {
  CaseAnalysisAnswer,
  CaseAnalysisQuestion,
} from "@project/shared";

function localOffset() {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absoluteMinutes / 60)).padStart(2, "0");
  const minutes = String(absoluteMinutes % 60).padStart(2, "0");
  return `${sign}${hours}:${minutes}`;
}

function validDateParts(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizeDateTimeAnswer(value: string): string | null {
  const trimmed = value.trim();

  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      trimmed,
    )
  ) {
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  const match = /^(\d{4})[\s./-]+(\d{1,2})[\s./-]+(\d{1,2})(?:일)?(?:\s+(오전|오후))?(?:\s+(\d{1,2})(?:\s*시|:(\d{1,2}))?(?:\s*(\d{1,2})\s*분)?)?$/.exec(
    trimmed,
  );

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const meridiem = match[4];
  let hour = match[5] ? Number(match[5]) : 0;
  const minute = Number(match[6] ?? match[7] ?? 0);

  if (!validDateParts(year, month, day) || minute > 59) return null;
  if (meridiem && (hour < 1 || hour > 12)) return null;
  if (!meridiem && (hour < 0 || hour > 23)) return null;

  if (meridiem === "오전" && hour === 12) hour = 0;
  if (meridiem === "오후" && hour < 12) hour += 12;

  const localDateTime = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${localOffset()}`;
  return new Date(localDateTime).toISOString();
}

export function normalizeQuestionAnswer(
  question: CaseAnalysisQuestion,
  value: CaseAnalysisAnswer["value"],
): CaseAnalysisAnswer["value"] | null {
  if (
    (question.answerType === "date" || question.answerType === "datetime") &&
    typeof value === "string"
  ) {
    return normalizeDateTimeAnswer(value);
  }

  if (question.answerType === "number" && typeof value === "string") {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  return value;
}
