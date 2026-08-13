import type { PIIPattern } from "openredaction";

export const KOREAN_PII_PATTERNS: PIIPattern[] = [
  { type: "PHONE_NUMBER", regex: /(?<=(?:전화번호(?:는)?|연락처(?:는)?|연락\s*가능한\s*번호는|제\s*번호(?:는|가)?|전화는|휴대폰\s*번호)[\s:]*)(?:\+82[- .]?10|010)[- .]?\d{4}[- .]?\d{4}/g, priority: 100, placeholder: "[PHONE_NUMBER_{n}]", severity: "high" },
  { type: "RRN", regex: /(?<=(?:주민등록번호|주민번호|등록번호)(?:는)?[\s:]*)\d{6}[- ]?[1-4]\d{6}\b/g, priority: 110, placeholder: "[RRN_{n}]", severity: "critical" },
  { type: "EMAIL", regex: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, priority: 120, placeholder: "[EMAIL_{n}]", severity: "high" },
  { type: "PASSPORT", regex: /(?<=(?:여권(?:\s*(?:번호|식별번호))?(?:는|은|가)?|Passport\s*No\.?)[\s:]*)(?:[MSROD]\s?\d{4}\s?\d{4})\b/gi, priority: 100, placeholder: "[PASSPORT_{n}]", severity: "high" },
  { type: "CARD_NUMBER", regex: /(?<=(?:카드번호(?:는)?|카드\s*번호(?:는)?|결제카드|카드\s*식별번호)[\s:]*)(?:\d[ .-]?){15}\d\b/g, priority: 90, placeholder: "[CARD_NUMBER_{n}]", severity: "critical" },
  { type: "BANK_ACCOUNT", regex: /(?<=(?:은행\s*)?(?:입금\s*|송금\s*)?계좌(?:번호)?(?:는|가)?[\s:]*)(?:\d{2,6}[ -]){2,3}\d{2,7}\b/g, priority: 105, placeholder: "[BANK_ACCOUNT_{n}]", severity: "high" },
  { type: "NAME", regex: /(?<=(?:제\s*)?이름은\s)[가-힣]{2,4}(?=입니다|이고|이며|이라고|라고|$)/g, priority: 70, placeholder: "[NAME_{n}]", severity: "high" },
  { type: "NAME", regex: /(?<=저는\s)[가-힣]{2,4}(?=입니다|이고|이며|이라고|라고)/g, priority: 70, placeholder: "[NAME_{n}]", severity: "high" },
  { type: "NAME", regex: /(?<=신고자\s*성명은\s)[가-힣]{2,4}(?=입니다|이고|이며|$)/g, priority: 70, placeholder: "[NAME_{n}]", severity: "high" },
  { type: "NAME", regex: /(?<=여권\s*소유자는\s)[가-힣]{2,4}(?=입니다|이고|이며|$)/g, priority: 70, placeholder: "[NAME_{n}]", severity: "high" },
  { type: "NAME", regex: /(?<=이름:\s*)[가-힣]{2,4}/g, priority: 70, placeholder: "[NAME_{n}]", severity: "high" },
  { type: "NAME", regex: /[가-힣]{2,4}(?=의\s*이메일은)/g, priority: 70, placeholder: "[NAME_{n}]", severity: "high" },
  { type: "NAME", regex: /(?<=(?:성명(?:은)?|신고자\s*이름은|제\s*성함은|저)[\s:]*)[가-힣]{2,4}(?=입니다|이고|이에요|이라고|라고)/g, priority: 70, placeholder: "[NAME_{n}]", severity: "high" },
];

// STT word-number patterns deliberately require a PII label. Applying these
// globally would turn ordinary times, quantities, and money into false positives.
export const KOREAN_STT_PATTERNS: PIIPattern[] = [
  { type: "PHONE_NUMBER", regex: /(?<=(?:전화번호(?:는)?|연락처(?:는)?|제\s*번호(?:는|가)?)[\s:]*)공일공\s[공일이삼사오육칠팔구]{4}\s[공일이삼사오육칠팔구]{4}/g, priority: 120, placeholder: "[PHONE_NUMBER_{n}]", severity: "high" },
  { type: "RRN", regex: /(?<=(?:주민번호|주민등록번호)(?:는)?\s)[공일이삼사오육칠팔구]{6}\s(?:다시\s)?[일이삼사][공일이삼사오육칠팔구]{6}/g, priority: 120, placeholder: "[RRN_{n}]", severity: "critical" },
  { type: "PASSPORT", regex: /(?<=여권(?:\s*번호)?(?:는|은|가)?\s)(?:M|엠)\s[공일이삼사오육칠팔구]{8}/g, priority: 120, placeholder: "[PASSPORT_{n}]", severity: "high" },
];
