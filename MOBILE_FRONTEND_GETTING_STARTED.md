# S09·S14 모바일 구현 가이드

이 문서는 `docs/USER_FLOW.md`에 확정된 S09 경위서 초안과 S14 경찰서 실시간 대응을 현재 모바일 코드 구조에 맞춰 구현하는 순서다.

기존 문서의 S11·S19·S20 구현 절차는 route, Screen, View, service와 mock이 이미 생성되었으므로 제거했다. 이 문서에서는 그 구현을 새 화면의 진입 기반으로만 사용한다.

구현의 최종 UI·문구·상태 기준은 항상 `docs/USER_FLOW.md`다. 이 문서의 타입과 경로 예시는 구현 방향이며 백엔드 계약이 확정되면 이름은 한 번에 정리한다.

---

## 1. 목표와 완성 흐름

S09의 정상 흐름은 다음과 같다.

```text
S07 경찰서 신고서 초안 `보기`
  → 현재 사건의 초안 조회 또는 생성
  → S09 일본어 被害届 확인
  → 한국어 확인 모드 전환
  → 필요 시 내용 수정·재생성
  → 저장 또는 공유
```

S14는 S11 가이드를 현장에서 실행하는 화면이다.

```text
S11 경찰서 현장 대응 action
  → S14 경찰관 제시용 사건 요약 스크립트
  → Agora 기반 한국어·일본어 turn-taking 통역
  → 신고서가 필요하면 `신고서 초안 생성`
  → S09 확인·수정·저장/공유
```

이번 구현 범위:

- S09·S14 route, Screen, 모바일·웹 View와 공통 View props
- 사건 카드 기반 일본어 신고서 초안과 경찰관 제시용 요약 스크립트
- S09 일본어·한국어 확인 전환, 수정·재생성 상태
- S14 원문·번역문 말풍선, 화자 전환, 마이크·연결·번역 상태
- S07 → S09, S11 → S14, S14 → S09 연결
- mock으로 모든 정상·오류·빈 값·긴 텍스트 상태 재현
- Agora RTC와 Real-Time Speech-to-Text·Translation 연동 경계
- 개인정보, 마이크 권한, 세션 종료와 로그 비노출 처리

정책 확정 전 구현하지 않는 것:

- 경찰 접수 완료로 오해할 수 있는 성공 처리
- 사용자 확인 없는 대화 내용의 사건 카드·S09 자동 반영
- 원본 음성 장기 저장 또는 통역 세션 녹음
- 번역 음성 자동 재생, speech-to-speech 또는 TTS
- 파일 형식·보관 정책이 없는 가짜 PDF 저장 성공
- Agora App Certificate, REST credential 또는 영구 RTC token의 앱 포함

---

## 2. 시작 전 기준선과 결정 사항

먼저 현재 상태를 확인한다.

```cmd
git status --short
pnpm.cmd --filter mobile typecheck
git diff --check
```

이미 존재하는 기반:

- `/case/documents` S07과 `POLICE_REPORT_DRAFT` 문서 카드
- `/case/guides` S11과 가이드 action handler
- `ActiveCaseContext`의 `caseId`, `caseNumber`, `source`, 선택적 `accessToken`
- `CaseDraftContext`의 입력 사건 draft
- `CaseBottomNavigation`
- 모바일·웹이 같은 `*.types.ts`를 사용하는 View 구조
- 공통 `AppScreen`, `Button`, `ErrorState`, `LoadingState`와 디자인 토큰

구현 전에 아래 제품 결정을 기록한다.

1. S09 route 이름
   - 이 문서의 제안: `/case/report`
2. S14 route 이름
   - 이 문서의 제안: `/case/police-support`
3. S14 하단 활성 탭
   - 와이어프레임 기준은 `사건`
   - 가이드 실행 화면으로 분류하려면 `가이드`로 바꾸고 `USER_FLOW.md`도 함께 갱신
4. S09 `내용 수정`의 목적 화면
   - S05 재진입인지 S09 내부 편집인지 확정
5. S09 `저장/공유` 결과
   - 파일 저장 선택창인지 기기 공유 UI인지 확정
6. Agora Real-Time Translation의 한국어↔일본어 지원, 프로젝트 활성화 권한, 비용과 목표 지연 시간

결정 전에도 View와 mock은 만들 수 있다. 다만 미확정 기능을 성공한 것처럼 보이는 handler는 추가하지 않는다.

---

## 3. 공통 책임과 feature 구조

기존 책임 분리를 유지한다.

```text
route: Screen만 렌더링
Screen: Router, Context, service, 비동기 상태와 수명주기
View: props 렌더링과 사용자 이벤트 전달
service: 백엔드 API와 mock 응답 정규화
device adapter: Agora, 마이크, 파일·공유 같은 기기 기능
```

View에서 Router, Context, API client, Agora SDK, `Share` 또는 파일 API를 직접 호출하지 않는다.

권장 구조:

```text
apps/mobile/app/case/report/index.tsx                  # S09
apps/mobile/app/case/police-support/index.tsx          # S14

apps/mobile/src/features/police-report/
  screens/PoliceReportScreen.tsx
  services/policeReport.ts
  services/mockPoliceReport.ts
  types/policeReport.ts
  views/PoliceReportView.tsx
  views/PoliceReportView.web.tsx
  views/PoliceReportView.types.ts

apps/mobile/src/features/police-support/
  screens/PoliceSupportScreen.tsx
  services/policeSupport.ts
  services/mockPoliceSupport.ts
  services/interpreterEngine.ts
  services/interpreterEngine.native.ts
  services/interpreterEngine.web.ts
  types/policeSupport.ts
  views/PoliceSupportView.tsx
  views/PoliceSupportView.web.tsx
  views/PoliceSupportView.types.ts
```

공유 가능한 순수 UI는 각 feature의 `components/`로 분리한다. S09 문서 섹션을 S14에 복사하지 않고 S14는 S09 route만 연다.

완료 기준:

- route 파일은 대응 Screen 하나만 반환한다.
- Screen만 `useRouter()`, `useActiveCase()`와 service를 사용한다.
- 모바일·웹 View가 같은 props 계약을 사용한다.
- native Agora import가 `.web.tsx` 또는 공통 View bundle에 들어가지 않는다.

---

## 4. 0단계 — 백엔드와 Agora 계약 확정

UI보다 먼저 실제 API와 mock이 함께 구현할 interface를 합의한다. `CaseDraftContext`는 S06 이후 초기화될 수 있으므로 S09·S14가 화면 생성의 원본으로 직접 의존하면 안 된다. 두 화면 모두 `activeCase.caseId`로 서버의 확정 사건 스냅샷을 조회한다.

### 4.1 S09 신고서 초안 계약

```ts
type PoliceReportService = {
  getOrCreateDraft(input: {
    caseId: string;
    accessToken?: string;
  }): Promise<PoliceReportDraft>;
  regenerateDraft(input: {
    caseId: string;
    draftId: string;
    sourceRevision: string;
    accessToken?: string;
  }): Promise<PoliceReportDraft>;
  createExport(input: {
    caseId: string;
    draftId: string;
    version: number;
    accessToken?: string;
  }): Promise<PoliceReportExport>;
};

type PoliceReportExport = {
  exportId: string;
  mimeType: string;
  localUri?: string;
  downloadUrl?: string;
  expiresAt?: string;
};
```

- `getOrCreateDraft`는 같은 사건·같은 source revision의 유효한 초안이 있으면 재사용한다.
- 생성 응답은 제출 완료가 아니라 초안 상태만 반환한다.
- 원본 사건이 바뀌면 `STALE` 또는 새로운 `sourceRevision`을 반환한다.
- 한국어 확인문과 일본어 제출문은 같은 field ID·item ID를 사용한다.
- export 계약이 미정이면 `createExport`를 mock 성공으로 만들지 말고 UI action을 준비 중 상태로 둔다.

### 4.2 S14 화면 데이터 계약

```ts
type PoliceSupportService = {
  getOverview(input: {
    caseId: string;
    accessToken?: string;
  }): Promise<PoliceSupportOverview>;
  createInterpreterSession(input: {
    caseId: string;
    accessToken?: string;
  }): Promise<InterpreterSessionCredentials>;
  closeInterpreterSession(input: {
    sessionId: string;
    accessToken?: string;
  }): Promise<void>;
};
```

`PoliceSupportOverview`는 일본어 제시 스크립트, 한국어 확인문, script revision과 허용된 AI 보조 action만 반환한다. 클라이언트에서 사건 원문을 임의로 요약하거나 일본어 문장을 새로 만들지 않는다.

S14가 CTA를 `신고서 초안 생성` 또는 `신고서 초안 보기`로 결정할 수 있도록 overview에 같은 사건의 초안 요약을 포함하거나 S09 service의 경량 상태 조회를 함께 사용한다. 제목이나 로컬 방문 이력으로 초안 존재 여부를 추정하지 않는다.

### 4.3 Agora 세션 계약

백엔드가 다음 값을 짧은 수명으로 발급한다.

- 무작위 `sessionId`, 개인정보가 없는 `channelName`
- RTC `uid`, 만료 시각과 짧은 수명의 token
- 허용된 입력 언어와 출력 언어
- 전사·번역 작업 식별자
- 재연결에 필요한 최소 상태

```ts
type InterpreterSessionCredentials = {
  sessionId: string;
  appId: string;
  channelName: string;
  uid: number;
  rtcToken: string;
  expiresAt: string;
  sourceLanguages: SupportedLanguage[];
  targetLanguages: SupportedLanguage[];
};
```

App Certificate와 REST credential은 백엔드에만 둔다. 앱에 들어갈 수 있는 값은 공개 App ID와 단기 세션 자격 정보뿐이다.

### 4.4 기능 검증 spike

본 구현 전에 별도 작은 화면 또는 개발 전용 adapter로 다음을 검증한다.

1. Expo SDK 54·React Native 0.81에서 선택한 Agora React Native SDK가 빌드되는지
2. Android·iOS 실제 기기에서 RTC 채널 입장·퇴장이 되는지
3. 한국어와 일본어 각각의 부분·최종 전사가 수신되는지
4. 한국어→일본어, 일본어→한국어 번역 결과가 구분되는지
5. 하나의 기기와 UID에서 앱이 선택한 `speakerRole`·`turnId`를 안전하게 매핑할 수 있는지
6. 세션 중지 뒤 서버 전사 작업과 마이크 publish가 모두 종료되는지

Agora SDK처럼 native code를 포함하는 라이브러리는 Expo Go로 검증하지 않는다. dependency와 config plugin을 확정한 뒤 development build를 만들고, native dependency 또는 `app.json` 변경 시 다시 빌드한다.

0단계 완료 기준:

- 실제 API와 mock이 같은 TypeScript interface를 구현한다.
- 한국어↔일본어의 실제 수신 payload 예시를 확보한다.
- 부분 결과, 최종 결과, 오류와 세션 종료 이벤트가 문서화되어 있다.
- 비밀값이 앱 bundle이나 `.env`에 들어가지 않는다.

---

## 5. 1단계 — 도메인 타입부터 작성

UI 문자열을 그대로 중첩 객체에 넣기 전에 두 화면이 공유할 식별자와 revision을 정의한다.

### 5.1 S09 타입

```ts
type LocalizedText = {
  ja: string;
  ko: string;
};

type PoliceReportField = {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
  required: boolean;
  missing: boolean;
};

type PoliceReportItem = {
  id: string;
  order: number;
  title: LocalizedText;
  details: Array<{ id: string; text: LocalizedText }>;
};

type PoliceReportDraft = {
  draftId: string;
  caseId: string;
  version: number;
  sourceRevision: string;
  status: "READY" | "STALE" | "FAILED";
  applicantFields: PoliceReportField[];
  incidentFields: PoliceReportField[];
  items: PoliceReportItem[];
  narrative: LocalizedText;
  missingFieldIds: string[];
};
```

- 이름·전화번호·날짜·금액의 저장 원본과 표시 문자열을 백엔드에서 구분한다.
- `LocalizedText`의 두 언어는 같은 사실을 나타내며 별도의 사건 데이터가 아니다.
- item은 배열 index가 아니라 안정적인 `id`를 key로 사용한다.
- 빈 필드를 fixture로 채우지 않는다. `missing`과 `missingFieldIds`로 명시한다.

### 5.2 S14 타입

```ts
type SpeakerRole = "TRAVELER" | "POLICE_OFFICER";
type SupportedLanguage = "ko-KR" | "ja-JP";

type InterpreterTurn = {
  id: string;
  sessionId: string;
  turnId: string;
  speakerRole: SpeakerRole;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  originalText: string;
  translatedText: string | null;
  sequence: number;
  status: "PARTIAL" | "FINAL" | "TRANSLATION_FAILED";
};

type PoliceSupportOverview = {
  caseId: string;
  sourceRevision: string;
  presentationScript: LocalizedText;
  suggestions: Array<{
    id: string;
    message: string;
    actionType: "SHOW_ITEMS" | "OPEN_REPORT" | "OPEN_CASE" | "NONE";
  }>;
};
```

- 공유 기기에서는 Agora UID만으로 화자를 판별하지 않는다.
- 마이크를 시작할 때 선택된 `speakerRole`과 새 `turnId`를 고정한다.
- 부분 결과는 같은 `turnId`를 갱신하고 최종 결과 뒤 새 말풍선을 만들지 않는다.
- 대화 transcript는 사건 카드나 S09에 자동 병합하지 않는다.

---

## 6. 2단계 — S09 View 계약과 정적 화면

먼저 service 없이 mock props만으로 View를 완성한다.

### 6.1 `PoliceReportViewProps`

표시 props:

- `draft`, `displayLanguage: "ja" | "ko"`
- `isLoading`, `isSwitchingLanguage`, `isRegenerating`, `isExporting`
- `errorMessage`, `translationErrorMessage`, `exportErrorMessage`
- `canExport`, `hasUnsavedChanges`

이벤트 props:

- `onBack`, `onRetry`, `onToggleLanguage`
- `onEdit`, `onRegenerate`, `onSaveOrShare`
- `onCaseTab`, `onGuideTab`, `onDocumentsTab`

### 6.2 화면 순서

`USER_FLOW.md`의 S09 순서를 그대로 구현한다.

```text
신고서 작성 지원 헤더
→ AI 신고서 초안 완성 안내
→ 한국어로 내용 확인 switch
→ 被害届 / HIGAITODOKE 문서 카드
→ 신고인 정보
→ 사건 개요
→ 피해 물품
→ 피해 상황 상세
→ 내용 수정 / 저장·공유
→ 하단 탭
```

- switch가 꺼지면 일본어, 켜지면 같은 field ID의 한국어 값을 표시한다.
- 일본어 원본을 한국어 확인 값으로 덮어쓰지 않는다.
- 긴 일본 주소·물품명·경위 문단은 카드 안에서 줄바꿈한다.
- `내용 수정`은 outline, `저장/공유`는 primary 우선순위를 사용한다.
- `저장/공유`는 기본적으로 일본어 초안을 대상으로 한다.
- 카드 끝의 action과 하단 내비게이션이 스크롤 본문을 가리지 않게 safe area를 확인한다.

### 6.3 View 상태 fixture

최소 다음 fixture를 준비한다.

- 정상 일본어, 정상 한국어 확인
- 생성 중, 번역 전환 중, 재생성 중
- 필수 정보 누락, 물품 없음, 긴 경위
- 초안 stale, 생성 실패, export 실패
- 큰 글자와 좁은 화면

완료 기준:

- 모바일·웹 View가 같은 props로 같은 정보 순서를 표시한다.
- View 안에 service·Router·Context·Share 호출이 없다.
- 언어 전환 전후 section과 item 개수·순서가 같다.

---

## 7. 3단계 — S09 Screen·service·route 연결

`PoliceReportScreen`은 다음 순서로 동작한다.

1. `useActiveCase()`로 현재 사건을 확인한다.
2. 활성 사건이 없으면 API를 호출하지 않고 홈 또는 S07로 돌아갈 수 있는 오류 화면을 표시한다.
3. `getOrCreateDraft({ caseId, accessToken })`를 호출한다.
4. request ID 또는 abort 정책으로 unmount 뒤 응답을 무시한다.
5. 초안과 화면 언어를 별도 state로 관리한다.
6. `STALE`이면 사용자 확인 뒤에만 재생성한다.
7. `내용 수정` 시 확정된 목적 route로 이동한다.
8. `저장/공유`는 Screen에서 export service와 기기 API를 순서대로 호출한다.

연결 지점:

- S07 `DocumentsScreen.handleOpenDocument()`에서 `POLICE_REPORT_DRAFT`이면 `/case/report`로 이동한다.
- S09 뒤로가기는 기본적으로 S07로 복귀한다.
- 편집된 값이 있다면 이탈 전에 폐기 여부를 확인한다.
- `Documents` 탭은 S07, `Guide` 탭은 S11로 연결한다.

저장·공유 구현 순서:

1. 서버가 인증된 사건과 draft version을 검증한다.
2. 서버 또는 승인된 로컬 경계에서 일본어 파일을 생성한다.
3. Screen은 반환된 안전한 local URI 또는 만료 링크만 기기 저장·공유 adapter에 전달한다.
4. 취소는 오류로 표시하지 않고, 실패 시 초안과 수정 상태를 유지한다.
5. 파일명·URL·로그에 이름, 전화번호 또는 사건번호 원문을 넣지 않는다.

export 정책이 확정되지 않았다면 버튼은 `준비 중` 안내만 제공하거나 비활성화한다. 텍스트 파일을 PDF처럼 공유하는 임시 구현은 만들지 않는다.

---

## 8. 4단계 — S14 View 계약과 mock 통역

Agora를 붙이기 전에 reducer와 mock event stream으로 화면 전체를 완성한다.

### 8.1 `PoliceSupportViewProps`

표시 props:

- `overview`, `turns`, `activeSpeakerRole`
- `isLargeText`, `sessionStatus`, `microphoneStatus`
- `isTranscribing`, `isTranslating`
- `permissionErrorMessage`, `connectionErrorMessage`
- `reportDraftStatus: "NONE" | "GENERATING" | "READY" | "FAILED"`
- `reportDraftErrorMessage`

이벤트 props:

- `onBack`, `onToggleLargeText`
- `onSelectSpeaker(role)`, `onPressMicrophone`
- `onRetryConnection`, `onRetryTranslation(turnId)`
- `onRunSuggestion(suggestionId)`
- `onCreateOrOpenReport`
- 하단 탭 이벤트

### 8.2 화면 순서

```text
경찰 지원 헤더
→ AI 상황 요약 / 큰 글씨
→ 경찰관 제시용 일본어 스크립트와 한국어 확인문
→ 여행자·경찰관 대화 말풍선
→ 검증된 AI 보조 제안
→ 신고서 초안 생성 또는 보기
→ 한국어 여행자 / 마이크 / 日本語 경찰관
→ 하단 탭
```

- 여행자는 우측 파란 말풍선, 경찰관은 좌측 회색 말풍선을 사용한다.
- 각 말풍선 위에는 원문, 아래에는 번역문을 둔다.
- partial은 임시 표시하고 final 이벤트가 같은 turn을 교체한다.
- `큰 글씨`는 경찰관용 일본어 스크립트를 확대하며 닫기·복귀 action을 제공한다.
- `신고서 초안 생성`은 마이크 바로 위에서 항상 발견 가능하게 둔다.
- S09 초안이 존재하면 label을 `신고서 초안 보기`로 바꾼다.

### 8.3 mock interpreter

`InterpreterEngine`을 Agora와 분리한다.

```ts
type InterpreterEngine = {
  connect(credentials: InterpreterSessionCredentials): Promise<void>;
  startTurn(input: {
    turnId: string;
    speakerRole: SpeakerRole;
    sourceLanguage: SupportedLanguage;
    targetLanguage: SupportedLanguage;
  }): Promise<void>;
  stopTurn(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(listener: (event: InterpreterEvent) => void): () => void;
};
```

mock은 다음 순서의 event를 시간 제어 가능하게 발생시킨다.

```text
CONNECTING → CONNECTED
→ LISTENING
→ PARTIAL_TRANSCRIPT 여러 번
→ FINAL_TRANSCRIPT
→ TRANSLATION_PARTIAL 또는 TRANSLATING
→ TRANSLATION_FINAL
```

연결 실패, 번역만 실패, 늦은 partial, 중복 final, stop 중 연결 단절도 재현한다.

완료 기준:

- 실제 Agora SDK 없이 전체 화면·상태·S09 CTA를 검증할 수 있다.
- reducer가 늦은 partial로 final을 덮어쓰지 않는다.
- 한 번에 하나의 turn만 녹음 상태다.

---

## 9. 5단계 — S14 Screen과 세션 수명주기

`PoliceSupportScreen`의 정상 동작 순서:

1. 활성 사건을 검사한다.
2. `getOverview(caseId)`로 스크립트와 허용된 제안을 조회한다.
3. 사용자가 처음 마이크를 누를 때 마이크 권한을 요청한다.
4. 백엔드에서 단기 interpreter session을 만든다.
5. engine에 연결하고 현재 화자의 turn을 시작한다.
6. event를 reducer에 전달해 같은 turn의 말풍선을 갱신한다.
7. 마이크를 다시 누르거나 무음 종료 시 turn을 확정한다.
8. 다음 발화 전에 여행자·경찰관 역할을 명시적으로 선택한다.
9. 이탈·S09 이동·앱 background 시 마이크와 세션을 정리한다.

중요한 상태 규칙:

- 연결 중에는 중복 `connect()`를 막는다.
- 발화 시작 시 `speakerRole`, source·target language와 `turnId`를 고정한다.
- 발화 도중 화자 전환을 허용하지 않는다.
- 원문 전사가 확정되면 번역 실패 시에도 원문은 유지한다.
- 재연결 시 이미 확정된 turn을 재전송하지 않는다.
- 화면 unmount 후 들어온 event는 무시한다.
- `expo-audio`의 S02 recorder와 Agora가 동시에 마이크를 점유하지 않게 각 Screen cleanup을 보장한다.

앱 수명주기:

- `AppState`가 background로 바뀌면 현재 turn을 중지한다.
- 전화·오디오 interruption이 발생하면 녹음 성공으로 처리하지 않는다.
- 화면 이탈 시 listener unsubscribe → audio publish 중지 → channel leave → 서버 session close 순서로 정리한다.
- close API가 실패해도 client token 만료와 서버 TTL로 작업이 종료되게 한다.

---

## 10. 6단계 — Agora native adapter와 development build

native SDK를 공통 View나 Screen에 직접 흩뿌리지 않고 `interpreterEngine.native.ts` 안으로 제한한다.

진행 순서:

1. 공식 Agora React Native RTC SDK 중 Expo SDK 54·RN 0.81 호환 버전을 선택하고 lockfile에 고정한다.
2. 필요한 config plugin 또는 native 설정, Android·iOS 마이크 권한 문구를 `app.json`에 추가한다.
3. `expo-dev-client`와 development build 방식을 팀 표준으로 확정한다.
4. native dependency를 설치한 뒤 Android·iOS development build를 새로 만든다.
5. RTC engine 초기화, channel join, local audio publish와 leave를 adapter에 구현한다.
6. 백엔드가 시작한 Real-Time Speech-to-Text·Translation 결과를 event로 정규화한다.
7. Agora 원본 payload를 View에 전달하지 않고 `InterpreterEvent`로 변환한다.
8. token 만료 전 갱신, 연결 손실, 재입장과 session close를 검증한다.

주의:

- Expo Go에서는 native Agora 연동 QA를 완료했다고 판단하지 않는다.
- package 이름과 버전은 공식 문서 및 spike 결과를 확인한 뒤 설치한다. 임의의 오래된 예제를 복사하지 않는다.
- Android와 iOS 권한 문구는 통역을 위해 음성을 처리한다는 목적을 명확히 설명한다.
- web은 native adapter를 import하지 않는다. 웹 제공 범위가 확정되기 전에는 동일 View와 안전한 미지원 안내를 사용하고, 필요하면 별도의 Agora Web adapter를 구현한다.

---

## 11. 7단계 — S11·S14·S09·S07 연결

### 11.1 S11 → S14

제목이나 `guideId` 문자열을 비교해 route를 결정하지 않는다. `GuideActionType`에 명시적인 서버 action을 추가한다.

```ts
type GuideActionType =
  | "CALL"
  | "MAP"
  | "DETAIL"
  | "FORM"
  | "POLICE_SUPPORT"
  | "NONE";
```

`CaseGuidesScreen.handleRunGuideAction()`에서 검증된 `POLICE_SUPPORT`만 `/case/police-support`로 보낸다. 서버가 허용하지 않은 action parameter는 실행하지 않는다.

### 11.2 S14 → S09

- 초안 없음: `getOrCreateDraft()`를 시작하고 중복 마이크 입력을 막은 뒤 `/case/report`로 이동한다.
- 초안 있음: 재생성하지 않고 `/case/report`로 이동한다.
- 필수 사건 정보 누락: S14에서 값을 추정하지 않고 사건 정보 보완 action을 제공한다.
- 이동 전 현재 Agora turn과 session을 종료한다.

### 11.3 S07 → S09

`DocumentsScreen.handleOpenDocument()`의 `POLICE_REPORT_DRAFT` 준비 중 Alert를 `/case/report` 이동으로 교체한다. 다른 문서 kind의 기존 동작은 바꾸지 않는다.

### 11.4 하단 탭

- S09: `Documents` 활성, S07로 복귀 가능하게 하는 구성이 정보 구조상 자연스럽지만 `USER_FLOW.md`의 현재 S09 기준은 `Incident` 활성이다. 제품 결정을 먼저 반영한다.
- S14: 현재 와이어프레임 기준 `사건` 활성이다. `가이드` 활성으로 변경할 경우 문서와 앱을 함께 갱신한다.
- 어떤 탭을 선택하든 활성 사건을 유지하고 Agora 세션은 종료한다.

---

## 12. 8단계 — 개인정보·번역 안전성

- 원본 음성은 기본적으로 저장하지 않는다.
- transcript 저장 여부와 보관 기간이 확정되기 전에는 메모리 상태로만 유지한다.
- 이름, 전화번호, 여권번호, 주소, 사건번호와 transcript를 log·analytics·crash message에 넣지 않는다.
- channel name, UID와 export URL에 개인정보를 사용하지 않는다.
- 핵심 사실은 원문과 번역문을 함께 표시한다.
- 이름·숫자·금액·날짜·여권번호는 별도 확인 안내를 제공한다.
- AI 제안은 서버가 검증한 action만 실행한다.
- 대화에서 나온 새 사실은 사용자 확인 없이 사건 카드나 신고서에 추가하지 않는다.
- S09의 `AI 신고서 초안 완성`은 경찰 제출 완료 상태로 사용하지 않는다.
- 마이크 시작 전 여행자에게 음성 처리 목적을 안내하고 경찰관 고지·동의 정책을 적용한다.

---

## 13. 9단계 — 접근성·웹·레이아웃

S09:

- switch에 label, checked 상태와 설명을 제공한다.
- 문서의 일본어·한국어 전환을 스크린 리더가 알 수 있게 한다.
- 일본어 텍스트의 언어 정보를 플랫폼이 지원하는 범위에서 제공한다.
- 긴 경위와 큰 시스템 글자에서 action이 잘리지 않게 한다.

S14:

- 현재 화자를 색상만으로 표시하지 않고 `여행자 말하는 중`, `경찰관 말하는 중`을 제공한다.
- 마이크에 녹음 시작·중지와 busy 상태를 제공한다.
- partial transcript 변화가 스크린 리더를 과도하게 방해하지 않도록 final 위주로 알린다.
- `큰 글씨` 모드에서 닫기, 화면 방향과 safe area를 확인한다.
- 말풍선 읽기 순서는 시각적 순서와 접근성 순서가 같아야 한다.

공통:

- 모바일·웹은 최대 약 `480px` 콘텐츠 폭과 같은 세로 순서를 유지한다.
- 웹 keyboard focus, Tab 이동, switch와 버튼의 Enter·Space 동작을 확인한다.
- native 미지원 기능 때문에 웹 전체 화면이 crash하지 않게 한다.

---

## 14. 10단계 — 정적 검사와 테스트

구현 중 각 단계가 끝날 때 실행한다.

```cmd
pnpm.cmd --filter mobile typecheck
git diff --check
```

순수 함수 테스트 대상:

- S09 언어별 field mapping과 누락 필드 판정
- source revision 변경 시 stale 판정
- S14 partial → final turn reducer
- 늦은 partial·중복 final 무시
- `speakerRole`에 따른 source·target language 매핑
- S11 `POLICE_SUPPORT` action routing

코드 검색 점검:

```cmd
rg -n "Agora|Rtc|AppCertificate|REST.*secret|channelName|uid" apps\mobile
rg -n "console\.|analytics|transcript|phone|passport" apps\mobile\src\features\police-report apps\mobile\src\features\police-support
rg -n "router\.(push|replace)" apps\mobile\src\features\police-report apps\mobile\src\features\police-support
```

비밀값, 개인정보 로그와 View 내부 Router 호출이 검색되면 제거하거나 책임 경계를 수정한다.

---

## 15. 11단계 — 실기기 QA 시나리오

### S09 정상 흐름

1. S07의 경찰서 신고서 초안을 눌러 S09로 이동한다.
2. 일본어 초안의 섹션과 사건 카드 사실이 일치하는지 확인한다.
3. 한국어 확인을 켜고 section·item 순서가 유지되는지 확인한다.
4. 다시 일본어로 돌아와 원본이 변하지 않았는지 확인한다.
5. 내용 수정 뒤 stale·재생성 상태를 확인한다.
6. 저장·공유 취소와 실패에서 초안이 유지되는지 확인한다.

### S14 정상 흐름

1. S11의 경찰서 현장 대응 action으로 S14에 진입한다.
2. 일본어 스크립트와 한국어 확인문이 사건 카드 사실과 일치하는지 확인한다.
3. 큰 글씨 모드를 열고 경찰관 제시문을 확인한 뒤 복귀한다.
4. 여행자 한국어를 말해 한국어 원문·일본어 번역이 우측 말풍선에 표시되는지 확인한다.
5. 경찰관 일본어를 말해 일본어 원문·한국어 번역이 좌측 말풍선에 표시되는지 확인한다.
6. `신고서 초안 생성`으로 마이크·세션이 종료되고 S09가 열리는지 확인한다.
7. 재진입하면 `신고서 초안 보기`로 표시되는지 확인한다.

### 오류·수명주기

- 마이크 권한 거부와 설정 이동
- Agora token 만료, 연결 실패, 재연결
- 전사는 성공하고 번역만 실패한 상태
- airplane mode 전환과 느린 네트워크
- 녹음 중 앱 background, 화면 뒤로가기와 전화 interruption
- S09 이동 중 미확정 partial 도착
- 활성 사건 없는 deep link
- 긴 일본어·한국어 문장, 물품 0개·다수, 필수 정보 누락
- Android·iOS 실제 기기와 웹 fallback

### 보안 확인

- 앱 로그에 token, credential, transcript와 개인정보가 없는지
- 세션 종료 뒤 마이크 표시와 서버 작업이 남지 않는지
- 다른 사건으로 전환했을 때 이전 초안·대화가 노출되지 않는지
- 공유 파일과 만료 링크가 다른 사용자에게 열리지 않는지

---

## 16. 실제 작업 순서 요약

1. typecheck와 worktree 기준선 확인
2. S09·S14 route 이름, 활성 탭, 수정과 export 정책 확정
3. 백엔드 신고서·스크립트·Agora session 계약 확정
4. Agora 한국어↔일본어·Expo development build spike
5. S09·S14 domain type와 service interface 작성
6. S09 모바일·웹 View와 상태 fixture 구현
7. S09 Screen·mock 연결 후 S07 진입 연결
8. S14 모바일·웹 View, turn reducer와 mock interpreter 구현
9. S14 Screen 세션 수명주기와 S11 action 연결
10. Agora native adapter, 권한과 development build 적용
11. S14 → S09 생성·보기 연결
12. 개인정보·접근성·웹 fallback 보완
13. typecheck, diff 검사와 reducer 테스트
14. Android·iOS 실기기 정상·오류·보안 QA

완료 기준은 다음과 같다.

- S07 → S09와 S11 → S14 → S09 흐름이 활성 사건을 유지하며 동작한다.
- S09는 일본어 원본과 한국어 확인본의 사실·순서를 일치시키고 원본을 덮어쓰지 않는다.
- S14는 여행자·경찰관 turn을 구분하고 원문·번역문을 함께 보존한다.
- Agora 세션은 권한 거부, 연결 실패, background와 화면 이탈에서 안전하게 종료된다.
- 대화의 새 사실은 사용자 확인 없이 사건 카드나 신고서에 반영되지 않는다.
- 개인정보, Agora 비밀값과 transcript가 앱 로그·route·channel 식별자에 노출되지 않는다.
