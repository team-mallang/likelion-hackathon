# S16 신고서 확인 모바일 구현 가이드

이 문서는 `docs/USER_FLOW.md`의 S16 신고서 확인 화면만 구현하기 위한 단계별 가이드다. S15 촬영·파일 선택·저장/공유와 기존 S09, S07, 공통 하단 내비게이션 구현 가이드는 완료되어 있어 반복하지 않는다.

S16은 S15에서 받은 일회성 사진 세션을 보여주고, mock 또는 향후 OCR 결과의 접수 번호·발생 일시·관할서를 사용자가 검수·수정한 다음 S07 서류함으로 이동시키는 화면이다. 사진 원본과 OCR 원문은 서버에 자동 저장하지 않는다.

## 시작 전 기준선

```cmd
git status --short
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

기존 기반은 `ActiveCaseContext`, S15 `/case/report-photo`, S07 `/case/documents`, 공통 `CaseBottomNavigation`, `expo-image-picker`다. S16은 아직 OCR 백엔드가 없으므로 mock review service부터 구현한다.

## 0단계 — 제품 계약과 세션 수명주기 확정

현재 완료: S15에서 S16으로 전달되는 값은 `S15_REPORT_PHOTO` 출처와 opaque `sessionId`로 제한하고, 사진 URI·OCR 원문·수정 draft는 서비스의 단기 메모리 세션에만 보관하도록 계약했다.

1. S15 사진 선택 성공 후 `사진 확인` action으로 S16에 진입하도록 확정한다.
2. route에는 사진 URI·base64·OCR 원문을 넣지 않고, `S15_REPORT_PHOTO` 출처와 opaque review session ID만 navigation state로 전달한다.
3. S16 Screen이 사진 URI·추출 필드·사용자 수정 draft를 메모리에만 보관한다.
4. 뒤로가기·다시 촬영·탭 이동·background·unmount 시 request를 무효화하고 review session과 photo reference를 정리한다.
5. S16은 `보관 완료`, `보험 제출 가능`을 자동 확정하지 않는다. 표기는 `검수 필요`, `검수 완료`, `보험 제출 전 확인`으로 제한한다.

## 1단계 — domain type과 service interface

현재 완료: `report-document-review` feature에 review 상태·필드·confidence·세션·navigation target 타입과 create/get/update/clear service interface, 안전한 오류 코드, mock service를 추가했다. mock은 정상·실패·필수값 누락 시나리오를 지원하며 실제 OCR 분석을 가장하지 않는다.

권장 위치:

```text
apps/mobile/src/features/report-document-review/
  types/reportDocumentReview.ts
  services/reportDocumentReview.ts
  services/reportDocumentReviewNavigation.ts
  services/mockReportDocumentReview.ts
  utils/reportDocumentReviewDisplay.ts
```

구현할 타입:

```ts
type ReportDocumentFieldKey = "incidentNumber" | "occurredAt" | "policeStation";
type ReportDocumentReviewStatus = "LOADING" | "REVIEW_REQUIRED" | "READY_FOR_DOCUMENTS" | "FAILED";

type ReportDocumentField = {
  key: ReportDocumentFieldKey;
  label: string;
  value: string;
  confidence?: "HIGH" | "MEDIUM" | "LOW";
  editable: boolean;
};

type ReportDocumentReviewService = {
  createSession(input: { source: "S15_REPORT_PHOTO" }): Promise<{ sessionId: string }>;
  getReview(sessionId: string): Promise<{ status: ReportDocumentReviewStatus; fields: ReportDocumentField[] }>;
};
```

오류 코드는 `SESSION_NOT_FOUND`, `PHOTO_NOT_AVAILABLE`, `REVIEW_FAILED`, `REVIEW_CANCELLED`처럼 안전한 코드로 제한한다. provider 원문 오류와 OCR 원문은 UI·로그에 노출하지 않는다.

## 2단계 — View 계약과 정적 화면

현재 완료: `ReportDocumentReviewViewProps`와 모바일·웹 View를 추가했다. 사진 미리보기, 검수 상태 badge, 접수 번호·발생 일시·관할서 카드, 필드별 편집/저장/취소, 누락·실패·loading 상태, 보험 제출 전 안내, 서류함 이동·다시 촬영 CTA와 서류 활성 하단 내비게이션을 정적으로 렌더링한다.

`ReportDocumentReviewViewProps`는 사진 URI 자체가 아니라 View용 preview source, review status, fields, field error, callback만 받는다. View는 router·OCR service·storage를 직접 호출하지 않는다.

화면 순서:

1. 뒤로가기와 중앙 제목 `신고서 확인`
2. `문서 확인`과 `검수 필요` badge
3. contain 방식의 신고서 사진 preview
4. `문서 정보 확인`과 `추출된 정보가 정확한지 확인하고 필요하면 수정해 주세요.`
5. 접수 번호·발생 일시·관할서 수정 카드
6. `보험 제출 전 확인` 안내 카드
7. `서류함으로 이동`, `다시 촬영하기`
8. `서류` 활성 하단 내비게이션

모바일·웹 View는 같은 props로 loading, 누락, 실패, 수정 중, 검수 완료를 렌더링한다. 480px 이하에서도 긴 관할서명과 CTA가 줄바꿈·스크롤로 안전하게 표시되어야 한다.

## 3단계 — Screen·route·S15/S07 연결

현재 완료: `/case/report-review` route와 `ReportDocumentReviewScreen`을 추가했다. S15 preview의 `사진 확인` action이 opaque review session을 만들고 S16으로 이동하며, 필드 수정·필수값 검증·S07 서류함 이동·다시 촬영/탭 이동 시 세션 정리를 Screen이 담당한다.

1. `/case/report-review` route는 `ReportDocumentReviewScreen`만 렌더링한다.
2. S15의 사진 선택/촬영 후 preview CTA를 `S16_REPORT_REVIEW` navigation state와 함께 S16으로 연결한다.
3. Screen은 `LOADING → REVIEW_REQUIRED → READY_FOR_DOCUMENTS` 및 `FAILED` 상태를 소유한다.
4. 필드 수정은 Screen draft에만 반영하고, 취소 시 원래 추출값으로 되돌린다.
5. 필수값이 존재하고 사용자가 검수한 경우에만 S07 이동 CTA를 활성화한다.
6. S07에는 사진 원본이 아니라 검수 상태와 표시용 메타데이터만 전달한다. 영구 파일 보관 상태와 혼동하지 않는다.

## 4단계 — mock 분석·향후 OCR adapter 경계

현재 완료: `ReportDocumentReviewAnalyzer` interface를 추가하고, mock analyzer가 정상·필수값 누락·LOW confidence·안전한 실패 시나리오를 제공하도록 구성했다. 실제 OCR provider는 이 interface만 구현하면 교체할 수 있으며, 현재 mock은 OCR 완료나 보험 승인을 의미하지 않는다.

1. mock service는 정상·누락 필드·낮은 confidence·실패 결과를 각각 제공한다.
2. 실제 OCR adapter는 백엔드 계약 확정 후 별도 provider로 교체한다. 사진을 클라이언트에서 직접 제3자 AI에 전송하지 않는다.
3. API가 비동기 job을 쓴다면 route에는 job ID만 넣고 polling·timeout·cancel을 Screen/service 경계에서 처리한다.
4. 일본어 원문과 한국어 보조값의 동시 제공 여부, 날짜 표준화, 관할서 명칭 정규화는 백엔드 계약으로 확정한다.

## 5단계 — 개인정보·접근성·웹 fallback

현재 완료: 사진 preview에 대체 텍스트를 제공하고, 필드별 수정 label·hint·alert·busy/disabled 상태와 키보드 편집 가능한 웹 View를 적용했다. URI·파일명·OCR 원문은 navigation state·로그·analytics로 전달하지 않으며, route에는 `sessionId`와 출처만 남긴다.

- 사진 URI·파일명·base64·OCR 원문·개인정보를 route, console, analytics, crash message에 남기지 않는다.
- preview에는 `촬영한 신고서 사진 미리보기`, 수정 버튼에는 `접수 번호 수정`과 같은 명확한 label/hint를 제공한다.
- 필드 오류는 `alert`, 처리 중 CTA는 `busy`, 이동 불가 CTA는 `disabled`를 지정한다.
- 화면 낭독기는 현재 검수 상태와 다음 action을 읽을 수 있어야 한다.
- 웹은 키보드만으로 필드 편집, 저장/취소, 다시 촬영, 서류함 이동, 하단 탭을 조작할 수 있어야 한다.

## 6단계 — 정적 검사와 테스트

현재 완료: S16 analyzer·session·navigation 안전성 테스트를 추가하고 전체 모바일 테스트 36개, typecheck, diff 검사를 통과했다.

```cmd
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

최소 테스트 범위:

- S15 → S16 navigation state에 URI·base64가 없는지
- 정상·누락·실패 mock review 상태와 안전한 오류 문구
- 필수 필드 누락 시 S07 이동 차단, 수정 후 활성화
- 다시 촬영·뒤로가기·탭 이동·unmount 시 세션 정리
- route, log, analytics에 민감정보가 없는지 정적 검색
- 모바일·웹 accessibility label, disabled/busy, 480px 레이아웃

## 7단계 — 실기기·웹 QA

1. S15에서 촬영/선택 후 S16 preview가 정상 표시되는지 확인한다.
2. 접수 번호·발생 일시·관할서를 수정하고 검수 완료 CTA가 활성화되는지 확인한다.
3. 사진이 없거나 분석이 실패한 상태에서 성공 문구·서류함 이동이 표시되지 않는지 확인한다.
4. 다시 촬영하기와 뒤로가기가 S15로 돌아가며 기존 세션을 정리하는지 확인한다.
5. iOS, Android, 웹에서 화면 낭독기·키보드·작은 폭 레이아웃을 확인한다.
