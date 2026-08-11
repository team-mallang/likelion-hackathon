# S11·S19·S20 모바일 구현 가이드

이 문서는 `docs/USER_FLOW.md`에 확정된 S11 행동 가이드, S19 이전 사건 정보 입력, S20 이전 사건카드 조회를 구현하는 순서다.

S07 서류 허브 구현 지침은 완료되었으므로 이 문서에서 제거했다. S08·S09 및 PDF·번역·공유·다운로드 기능은 이번 범위에 포함하지 않는다.

---

## 1. 이번 목표와 완성 흐름

이번 구현의 정상 흐름은 다음과 같다.

```text
S01 이전 사건 조회
  → S19 사건번호·비밀번호 입력
  → 이전 사건 인증·활성 사건 설정
  → S07 서류 허브
  → 사건 카드 (최종) 보기
  → S20 읽기 전용 이전 사건카드 상세
```

새 사건의 가이드 흐름은 다음과 같다.

```text
확정 사건 카드(S05/S06)
  → S11 행동 가이드
  → 가이드 카드 action 또는 S07 서류 허브
```

구현 범위:

- S19의 입력·검증·인증 상태와 이전 사건 조회 service 경계
- 조회 성공 후 `ActiveCase` 설정 및 S07 연결
- S20의 읽기 전용 사건카드 상세와 S07에서의 조건부 연결
- S11의 서버 가이드 목록 조회·표시·완료 상태와 하단 탭 연결
- 앱·웹이 공유하는 View props 계약, mock service, loading·오류·빈 상태

이번에 만들지 않는 것:

- 실제 PDF 생성·저장, 다운로드, 공유
- 경찰 제시용 번역 문서 또는 번역 화면
- S08 새 사건 사건카드 상세와 S09 신고서 초안 상세
- AI가 DB 밖의 안내를 작성하는 클라이언트 로직
- 지도 공급자 확정 전 실제 지도 SDK·외부 지도 앱 연동

---

## 2. 시작 전 확인과 공통 원칙

먼저 현재 기준선을 확인한다.

```cmd
pnpm.cmd --filter mobile typecheck
git diff --check
```

현재 이미 존재하는 기반은 다음과 같다.

- `/case/documents`와 `DocumentsScreen`(S07)
- `ActiveCaseContext`의 `caseId`, `caseNumber`
- S06 저장 성공 시 활성 사건을 설정하는 흐름
- documents feature의 Screen → View → service 분리
- 공통 사건번호 formatter `formatCaseNumber()`

이번 구현도 같은 책임을 지킨다.

```text
route: Screen만 렌더링
Screen: Router, Context, service, 비동기·입력 상태, 기기 API 경계
View: props 렌더링과 사용자 이벤트 전달
service: API/mock 응답 정규화
```

View에서 Router, Context, API client, Clipboard, 지도·파일 API를 직접 호출하지 않는다. 새 기능을 시작하기 전에 기존 사용자 변경과 충돌하는 파일이 있는지 `git status --short`로 확인한다.

---

## 3. 0단계 — 백엔드와 계약 먼저 확정

UI를 만들기 전에 아래 세 API 계약을 백엔드 담당자와 문서 또는 TypeScript interface 수준으로 합의한다. API가 미완성이면 같은 interface를 구현하는 mock으로 먼저 진행한다.

### 3.1 이전 사건 조회

```ts
lookupPreviousCase(input: {
  caseNumber: string;
  password: string;
}): Promise<{
  caseId: string;
  caseNumber: string;
  source: "RESTORED";
  accessToken: string;
}>;
```

- 사건번호 존재 여부를 드러내지 않는 인증 실패 코드가 필요하다.
- 비밀번호는 전송 후 로컬 상태에서만 유지하며 log·analytics·Context·route parameter에 넣지 않는다.
- rate limit·잠금 정책, 사건번호 정규화 규칙을 같이 확정한다.

### 3.2 이전 사건카드 상세

```ts
getPreviousCaseCard(caseId: string): Promise<PreviousCaseCard>;
```

응답은 최소 사건 식별 정보, 유형·일시·장소, 물품 목록, 보조 정보, AI 요약과 지도 표시 가능 여부를 포함한다. 원본 사건의 확정 스냅샷을 반환하며, S20에서 편집용 데이터로 바꾸지 않는다.

### 3.3 행동 가이드

```ts
getCaseGuides(caseId: string): Promise<CaseGuidesOverview>;
completeGuide(input: { caseId: string; guideId: string }): Promise<void>;
```

백엔드가 가이드 DB 후보 조회, 하드 안전 규칙, 우선순위 계산과 AI 결과 검증을 담당한다. 모바일은 서버가 검증해 준 `guideId`, 제목, 설명, 긴급도, action 유형, 완료 상태만 표시한다.

0단계 완료 기준:

- 실제 API와 mock이 같은 service interface를 구현할 수 있다.
- AI가 반환할 수 있는 범위와 DB 값만 사용할 범위가 구분되어 있다.
- 이전 사건과 새 사건을 식별할 최소 정보가 합의되어 있다.

---

## 4. 1단계 — 활성 사건 모델 확장

현재 `ActiveCase`는 `caseId`, `caseNumber`만 가진다. S07의 사건카드 `보기`가 S08 또는 S20으로 갈지 결정하려면 사건의 출처가 필요하다.

`ActiveCaseContext.tsx`를 다음 방향으로 확장한다.

```ts
type ActiveCaseSource = "NEW" | "RESTORED";

type ActiveCase = {
  caseId: string;
  caseNumber: string;
  source: ActiveCaseSource;
  accessToken?: string;
};
```

- S06에서 새로 저장한 사건은 `source: "NEW"`로 설정한다.
- S19 인증 성공 사건은 `source: "RESTORED"`로 설정한다.
- S19가 반환한 `accessToken`은 이전 사건 상세 조회에만 사용하고, 앱 메모리에서만 유지한다.
- S07은 `source`가 `RESTORED`일 때 사건카드 `보기`를 S20으로 보낸다. `NEW`는 S08 route가 생길 때까지 기존 준비 중 안내를 유지한다.
- 저장 정책이 정해지기 전에는 `ActiveCase`를 메모리 상태로 유지한다. 비밀번호를 persistent storage에 저장하지 않는다.

완료 기준:

- `resetDraft()` 후에도 활성 사건의 식별자·출처가 유지된다.
- 활성 사건이 없을 때 S07·S11·S20이 service를 호출하지 않고 안전한 fallback을 표시한다.

---

## 5. 2단계 — 공통 route와 feature 구조 만들기

route는 얇게 유지한다.

```text
apps/mobile/app/case/lookup/index.tsx       # S19
apps/mobile/app/case/guides/index.tsx       # S11
apps/mobile/app/case/card/index.tsx         # S20, RESTORED 사건 전용

apps/mobile/src/features/case-access/
  screens/PreviousCaseLookupScreen.tsx
  services/previousCase.ts
  services/mockPreviousCase.ts
  types/previousCase.ts
  views/PreviousCaseLookupView.tsx
  views/PreviousCaseLookupView.web.tsx
  views/PreviousCaseLookupView.types.ts

apps/mobile/src/features/guides/
  screens/CaseGuidesScreen.tsx
  services/guides.ts
  services/mockGuides.ts
  types/guides.ts
  views/CaseGuidesView.tsx
  views/CaseGuidesView.web.tsx
  views/CaseGuidesView.types.ts

apps/mobile/src/features/case-card/
  screens/PreviousCaseCardScreen.tsx
  services/caseCard.ts
  services/mockCaseCard.ts
  types/caseCard.ts
  views/PreviousCaseCardView.tsx
  views/PreviousCaseCardView.web.tsx
  views/PreviousCaseCardView.types.ts
```

기존 `/case/access`는 현재 S06 password route로 redirect하므로 S19에 재사용하지 않는다. 별도 `/case/lookup` route를 만든다.

완료 기준:

- 세 route 모두 Screen만 렌더링한다.
- 기존 S01~S07 route와 이름 충돌이 없다.
- 웹 View도 같은 `*.types.ts`를 사용한다.

---

## 6. 3단계 — S19 데이터·View 계약과 입력 화면

### 6.1 `PreviousCaseLookupViewProps`

표시 props:

- `caseNumber`, `password`, `isPasswordVisible`
- `caseNumberError`, `passwordError`, `submissionError`
- `isSubmitting`, `canSubmit`
- 하단 탭의 활성 값

이벤트 props:

- `onChangeCaseNumber`, `onChangePassword`, `onTogglePasswordVisibility`
- `onSubmit`, `onStartNewCase`, `onBack`
- `onCaseTab`, `onGuideTab`, `onDocumentsTab`

### 6.2 화면 순서

`docs/USER_FLOW.md`의 S19 순서를 유지한다.

1. 뒤로가기·`분실·도난 신고`·`3/6` 헤더
2. 이전 사건 불러오기 제목과 설명
3. 사건번호 입력, 8자 이상 비밀번호 입력·눈 아이콘
4. `사건 불러오기`, `새로운 사건 시작하기`
5. 복구 불가 경고, 데이터 보관 정책, 기획 확인 카드
6. 하단 `사건 / 가이드 / 서류` 탭

### 6.3 Screen 검증·제출

- 사건번호는 앞뒤 공백을 제거한다. 상세 포맷 validator는 백엔드 합의 뒤 하나만 사용한다.
- 비밀번호는 기존 사건 저장 정책과 동일하게 8자 이상 72자 이하로 허용한다.
- 두 값이 유효할 때만 제출 버튼을 활성화한다.
- 제출 중에는 버튼 loading과 중복 제출 차단을 적용한다.
- 인증 실패는 `사건번호 또는 비밀번호를 확인해주세요.` 하나의 문구만 보인다.
- 성공 시 `setActiveCase({ caseId, caseNumber, source: "RESTORED", accessToken })` 후 `/case/documents`로 이동한다.
- `새로운 사건 시작하기`는 입력 draft만 초기화하고 S02 `/case/new`로 이동한다.

### 6.4 S19 상태 QA

- 초기·입력 중·형식 오류·조회 중·인증 실패·네트워크 오류·성공
- 비밀번호 표시 전환 뒤에도 값이 유지되는지
- 실패 로그·alert·route parameter에 비밀번호가 없는지
- 활성 사건 없이 하단 탭이나 deep link를 눌러도 crash하지 않는지

---

## 7. 4단계 — S20 데이터·View 계약과 읽기 전용 상세

### 7.1 데이터 모델

`PreviousCaseCard`에는 화면이 필요한 정보만 둔다.

```ts
type PreviousCaseCard = {
  caseId: string;
  caseNumber: string;
  reportStatusLabel: string;
  title: string;
  incidentTypeLabel: string | null;
  occurredAt: string | null;
  locationLabel: string | null;
  mapPreview: { latitude: number; longitude: number } | null;
  aiSummary: string | null;
  aiSummaryStatus: "READY" | "GENERATING" | "UNAVAILABLE";
  lostItems: Array<{ id: string; title: string; description: string | null; statusLabel: string | null }>;
  clues: string | null;
  notes: string | null;
};
```

- 날짜는 service에서 ISO 문자열로 받고 Screen에서 표시 형식으로 바꾼다.
- AI 요약은 확정 사건카드에 있는 사실만 다시 서술한다. 없는 사실을 client에서 보완하지 않는다.
- 지도 좌표가 없으면 주소 텍스트만 표시한다.

### 7.2 `PreviousCaseCardViewProps`

- 카드 데이터, `isLoading`, `errorMessage`, 지도·AI 요약 상태
- `onBack`, `onRetry`, `onOpenMap`, 하단 탭 이벤트
- PDF·번역·공유 이벤트는 기능이 승인되기 전 props에 추가하지 않는다.

### 7.3 S20 Screen 동작

1. `useActiveCase()`를 읽는다.
2. 활성 사건이 없거나 `source !== "RESTORED"`면 service 호출 없이 S07 또는 홈으로 돌아갈 수 있는 fallback을 표시한다.
3. `getPreviousCaseCard(activeCase.caseId)`를 호출한다.
4. 원본 데이터는 유지하고 Screen에서 label·날짜만 표시용으로 변환한다.
5. S07의 사건카드 `보기` handler는 `RESTORED` 활성 사건에만 `/case/card`로 이동한다.
6. 뒤로가기는 S07으로 돌아간다.

### 7.4 레이아웃과 미확정 기능

기본 정보 → AI 사건 요약 → 피해 물품 → 있는 경우 현장 단서·특이사항 순서로 스크롤한다. 하단에는 `서류` 탭을 활성화한다.

`경찰에게 보여주기(번역)`, `PDF로 저장하기`, 내보내기 메뉴는 아직 만들지 않는다. placeholder 버튼·가짜 성공·PDF fixture도 만들지 않는다. 기능이 확정되면 별도 service와 보안 정책을 추가한다.

---

## 8. 5단계 — S11 가이드 데이터·View 계약

### 8.1 데이터 모델

```ts
type GuideUrgency = "URGENT" | "IMPORTANT" | "NORMAL";
type GuideActionType = "CALL" | "MAP" | "DETAIL" | "FORM" | "NONE";

type CaseGuide = {
  guideId: string;
  priority: number;
  urgency: GuideUrgency;
  title: string;
  description: string;
  estimatedMinutes: number | null;
  actionType: GuideActionType;
  actionLabel: string | null;
  isCompleted: boolean;
};

type CaseGuidesOverview = {
  caseId: string;
  caseNumber: string;
  reportStatusLabel: string;
  progressPercent: number;
  heading: string;
  recommendationReason: string | null;
  guides: CaseGuide[];
};
```

- 와이어프레임의 카드 제목·소요 시간·개수는 mock 기본값으로 고정하지 않는다.
- Screen은 `priority` 오름차순과 긴급도 정책을 검증하고, 긴급 항목을 목록 최상단에 둔다.
- action은 서버가 허용한 type만 실행한다. `NONE`은 설명·완료 상태만 표시한다.

### 8.2 `CaseGuidesViewProps`

- 현재 사건 요약, 가이드 목록, `isLoading`, `errorMessage`, `updatingGuideId`
- `onBack`, `onRetry`, `onRunGuideAction(guideId)`, `onCompleteGuide(guideId)`
- `onCaseTab`, `onGuideTab`, `onDocumentsTab`

### 8.3 Screen과 AI 경계

Screen은 `getCaseGuides(activeCase.caseId)`만 호출한다. 프론트엔드에서 음성 원문을 AI에 보내거나, AI가 문장을 생성하도록 호출하지 않는다.

- DB 원문, 링크, 기관 정보, action 파라미터는 서버 응답을 사용한다.
- API가 AI 후보 검증 실패·모델 장애를 반환해도 Screen은 일반 안내와 재시도만 보여준다.
- 긴급 가이드가 있으면 카드 맨 위에 고정한다.
- 카드 완료 요청 중에는 해당 카드만 busy로 만들고, 실패하면 이전 완료 상태로 되돌린다.

---

## 9. 6단계 — S11 화면·하단 탭 구현

레이아웃 순서:

```text
헤더(뒤로가기 / 분실·도난 신고 / 3/6)
→ 상황형 제목
→ 현재 사건 요약 카드
→ 우선 행동 가이드 카드 목록
→ 기획·정책 안내
→ 하단 탭(사건 / 가이드 활성 / 서류)
```

- 카드에는 텍스트 badge(`긴급`·`중요`·`일반`), 예상 소요 시간, 제목, 설명, 대표 action 하나, 완료 상태를 표시한다.
- 색상만으로 긴급도를 전달하지 않는다.
- 드래그 순서 변경은 구현하지 않는다. 추후 추가하더라도 개인 표시 순서만 변경하고 긴급 가이드의 우선순위를 낮출 수 없게 한다.
- `서류` 탭은 `/case/documents`로 연결한다. `가이드` 탭은 현재 화면을 유지한다. `사건` 탭은 대상 route 확정 전 안전한 안내를 표시한다.
- S06의 `저장하고 가이드 시작하기`와 S07의 `해당 사건 가이드 확인하기`는 S11 route가 생성된 뒤 `/case/guides`로 연결한다.

S11 상태:

- 조회 중: skeleton
- 정상: 서버 순서 카드 목록
- 긴급 행동 있음: 긴급 카드 최상단
- 가이드 없음: 사실을 추정하지 않는 안내와 사건 정보 확인 action
- 조회 실패: 기존 목록 유지 가능 시 유지, 재시도 제공
- 사건 카드 변경: 가이드 갱신 안내 후 재조회
- 완료 변경 실패: 해당 카드 근처에 오류·재시도

---

## 10. 7단계 — mock service와 연결 순서

각 service는 실제 API adapter와 교체 가능한 factory/interface를 둔다.

1. `mockPreviousCase`로 성공·인증 실패·네트워크 실패를 재현한다.
2. `mockCaseCard`로 지도 있음/없음, AI 요약 상태, 물품 없음, 긴 텍스트를 재현한다.
3. `mockGuides`로 긴급·일반·빈 목록·오류·완료 실패를 재현한다.
4. Screen과 View가 완성된 뒤 실제 API adapter를 같은 interface로 연결한다.

fixture에는 실제 비밀번호, 이메일, 정확한 개인 위치, 실제 파일 URI를 넣지 않는다. 긴 사건번호·주소·물품명은 UI 줄바꿈 검증용 가짜 값으로 준비한다.

---

## 11. 8단계 — 웹·접근성·디자인 검증

모바일 View와 웹 View는 같은 `*.types.ts`를 사용한다.

- 웹은 최대 약 `480px` 콘텐츠 폭과 모바일과 같은 세로 정보 순서를 유지한다.
- hover뿐 아니라 keyboard focus를 제공한다.
- 모든 뒤로가기·입력·제출·탭·가이드 action·완료 버튼에 명확한 접근성 label을 준다.
- loading 버튼에는 `busy`, 활성 탭에는 `selected`, 비활성 action에는 `disabled` 상태를 제공한다.
- 긴급도는 색상 외에 badge 텍스트로 전달한다.
- S19 오류는 입력칸 가까이에, S20·S11 오류는 해당 카드 또는 본문 상단에 표시한다.
- 작은 화면, 큰 글자, 긴 사건번호·주소·가이드 제목, safe area에서 레이아웃을 확인한다.

---

## 12. 9단계 — 정적 검사와 실기기 QA

구현 뒤 실행한다.

```cmd
pnpm.cmd --filter mobile typecheck
git diff --check
```

추가 점검:

```cmd
rg -n "router\\.(push|replace)" apps\mobile\src\features\case-access apps\mobile\src\features\guides apps\mobile\src\features\case-card
rg -n "password|casePassword" apps\mobile\src\features\case-access
```

실기기 정상 흐름:

1. S01에서 S19로 이동한다.
2. 올바른 정보로 이전 사건을 불러오고 S07이 열리는지 확인한다.
3. S07의 사건카드 `보기`가 S20으로 이동하는지 확인한다.
4. S20 뒤로가기가 S07으로 복귀하는지 확인한다.
5. S06 새 사건에서 S11로 이동하고, S07 가이드 링크도 S11로 이동하는지 확인한다.
6. S11의 `서류` 탭이 S07으로 돌아가는지 확인한다.

상태·보안 QA:

- S19 인증 실패가 사건번호 존재 여부를 드러내지 않는지
- S19 비밀번호가 로그·route·Context에 없는지
- 활성 사건 없이 S07·S11·S20 deep link 진입 시 crash하지 않는지
- S20에 PDF·번역 CTA 또는 가짜 성공이 없는지
- S11 긴급 카드가 최상단에 있고 완료 실패가 다른 카드에 영향을 주지 않는지
- 지도·AI 요약·물품이 없는 상태와 네트워크 재시도가 자연스러운지

---

## 13. 실제 작업 순서 요약

1. typecheck와 worktree 상태 확인
2. 백엔드와 S19·S20·S11 service 계약 확정
3. `ActiveCase.source`와 이전 사건용 단기 접근 토큰 추가 및 S06 저장 흐름 보완
4. S19 route·types·View·mock service·Screen 구현
5. S19 성공 시 활성 사건을 설정하고 S07로 연결
6. S20 route·types·View·mock service·Screen 구현
7. S07 사건카드 `보기`를 `RESTORED → S20`, `NEW → 기존 fallback`으로 연결
8. S11 route·types·View 계약·service interface 구현
9. S06·S07의 가이드 진입점을 S11으로 연결
10. 웹 View, 접근성, loading·오류·빈 상태 보완
11. typecheck·diff 검사
12. 실기기 정상·오류·보안 QA

완료 기준은 S19 → S07 → S20과 S06/S07 → S11 흐름이 안전하게 동작하고, 미확정 PDF·번역 기능을 노출하지 않으며, 가이드의 출처와 우선순위가 백엔드 검증 결과에만 의존하는 것이다.
