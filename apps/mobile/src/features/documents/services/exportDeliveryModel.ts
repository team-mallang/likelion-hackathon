export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidExportEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

export function emailSubject(caseNumber: string) {
  return `[Travel Guard] 사건 자료 - ${caseNumber}`;
}

export function emailBody(caseNumber: string) {
  return [
    "Travel Guard에서 정리한 사건 관련 자료입니다.",
    "",
    "첨부 파일에는 다음 자료가 포함되어 있습니다.",
    "- 사건 카드",
    "- 경찰 신고서 일본어 제출용 초안",
    "- 경찰 신고서 한국어 확인본",
    "- 사용자가 촬영한 첨부 자료",
    "",
    `사건번호: ${caseNumber}`,
  ].join("\n");
}
