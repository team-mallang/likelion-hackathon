# S01~S05 기능·앱 UI 구현 작업 가이드

이 문서는 현재 `feat/mobile-foundation` 브랜치의 실제 구현 상태를 기준으로, 이미 끝난 작업을 반복하지 않고 S05까지 완성하기 위한 작업 순서를 정리한다.

화면 요구사항은 `docs/USER_FLOW.md`, 전체 모바일 구조는 `apps/mobile/STRUCTURE.md`, 웹 화면 담당자의 작업 범위는 `EXPO_WEB_FRONTEND_GUIDE.md`를 기준으로 한다.

---

## 0. 이번 작업의 역할

내가 담당하는 범위:

- S01~S05의 기능과 상태 관리
- Expo Router 화면 이동
- Android·iOS에서 사용할 앱 UI
- 마이크 녹음과 권한 처리
- 위치 조회와 권한 처리
- mock 및 실제 API adapter
- View가 받을 props 타입과 이벤트 계약
- 로딩·오류·재시도·완료 동작
- Android 또는 iOS 실기기 QA

웹 화면 담당자의 범위:

- 내가 만든 props 계약을 사용하는 `*.web.tsx` View
- 데스크톱·태블릿·모바일 브라우저 반응형 화면
- 웹 hover·focus·Tab 이동
- 브라우저 화면 QA와 스크린샷

역할 경계:

```text
Route
  → Screen/Controller                 내가 구현
      ├─ 상태·기능·검증·화면 이동     내가 구현
      └─ View props 전달              내가 계약 정의
            ├─ SomethingView.tsx      내가 구현하는 앱 기본 UI
            └─ SomethingView.web.tsx  웹 화면 담당자가 구현
```

기본 앱 View는 `SomethingView.tsx`로 만든다. 웹 담당자가 같은 폴더에 `SomethingView.web.tsx`를 만들면 Expo Web에서 웹 파일이 우선 선택된다. Android·iOS에서는 기본 `SomethingView.tsx`를 사용한다.

플랫폼별 확장자 동작은 [Expo 플랫폼별 모듈 문서](https://docs.expo.dev/router/advanced/platform-specific-modules/)를 기준으로 한다. `app` route 자체는 모든 플랫폼에 공통인 기본 파일을 유지하고, `src/features` 아래 View만 플랫폼별로 나눈다.

> 앱 기본 View를 `.native.tsx`만으로 만들지 않는다. 현재 TypeScript 설정에서 extension 없는 import를 안정적으로 검사할 수 있도록 기본 `.tsx` 파일을 두고 웹만 `.web.tsx`로 덮어쓴다.

---

## 1. S05까지의 완료 기준

```text
S01 홈
  → S02 음성·텍스트 사건 입력
  → S03 인식 내용·위치·시간 확인
  → S04 추가 질문과 답변
  → S05 사건 카드 확인·수정·저장
```

완료 상태에서는 다음이 가능해야 한다.

- S01에서 새 사건을 시작한다.
- S02에서 실제 녹음 또는 텍스트로 사건 내용을 입력한다.
- 마이크 권한을 거부해도 텍스트 입력을 사용할 수 있다.
- 위치 권한을 거부해도 장소를 직접 입력할 수 있다.
- S03에서 사건 내용·장소·시간을 수정한다.
- 분석 중 중복 요청을 막고 실패 후 다시 시도한다.
- S04에서 질문을 한 개씩 확인하고 답변을 유지한다.
- S05에서 사건 유형·물품·장소·시간·상세 정보를 수정한다.
- S05 저장 중·필수값 오류·저장 실패·저장 성공 상태를 확인한다.
- 뒤로 이동해도 사용자가 입력한 draft가 의도대로 유지된다.
- 앱 View와 웹 View가 같은 Screen 기능과 props 계약을 사용한다.

S06~S20은 이번 범위가 아니다. S05 저장 성공 후에는 S06으로 이동하지 않고 다음 단계가 사건번호·비밀번호 설정이라는 안내만 표시한다.

---

## 2. 현재 완료된 부분

다음 항목은 현재 코드에 있으므로 다시 만들지 않는다.

### 프로젝트와 공통 기반

- Expo SDK 54와 Expo Router 설정
- TypeScript strict 설정과 `@/` path alias
- pnpm workspace와 mobile 실행 script
- `Button`의 primary·secondary·outline variant
- `AppTextInput`
- `LoadingState`
- `ErrorState`
- 최소 디자인 토큰

### 공통 화면 구조

- `AppScreen`
  - SafeArea
  - 스크롤
  - 키보드 회피
  - 공통 여백
  - footer 영역
- `FlowHeader`
  - 뒤로 가기
  - 중앙 제목
  - 단계 표시
- `ProgressBar`
- Root Stack의 기본 header 숨김
- `app/case/_layout.tsx`

### 사건 draft 기반

- `CaseDraft` 타입
- `initialCaseDraft`
- `CaseDraftProvider`
- `updateDraft()`
- `resetDraft()`
- `answerQuestion()`
- `useCaseDraft()`
- Root Layout에 Provider 연결

### 화면 구현 상태

| 화면 | 현재 상태 | 남은 일 |
|---|---|---|
| S01 | UI와 사건 시작 이동 구현 | Screen과 앱 View 분리, props 계약 제공 |
| S02 | route와 임시 문장 입력 버튼 구현 | 전체 상태·앱 UI·녹음·텍스트·위치·S03 이동 |
| S03 | 미구현 | route, Screen, props, 앱 View, 분석 기능 |
| S04 | 미구현 | route, Screen, props, 앱 View, 답변 기능 |
| S05 | 미구현 | route, Screen, props, 앱 View, 수정·저장 기능 |

현재 완료 여부는 파일 존재만으로 판단하지 않는다. S02는 `VoiceInputScreen.tsx`가 존재하지만 임시 문장 입력만 있으므로 완료 상태가 아니다.

---

## 3. 지금 만들 최종 폴더 구조

현재 파일을 다음 구조로 점진적으로 정리한다. 아래 구조에는 앱 전체에 적용되는
루트 `_layout.tsx`와 이미 만들어져 있는 이후 기능용 route 폴더도 함께 표시했다.
`lookup`, `setup`, `[caseNumber]` 아래 폴더는 이번 사건 등록 흐름의 구현 대상은
아니지만 기존 확장 경로이므로 삭제하지 않는다.

```text
apps/mobile/
├─ app/
│  ├─ _layout.tsx
│  ├─ index.tsx
│  └─ case/
│     ├─ _layout.tsx
│     ├─ new/
│     │  └─ index.tsx
│     ├─ review/
│     │  └─ index.tsx
│     ├─ questions/
│     │  └─ index.tsx
│     ├─ confirmation/
│     │  └─ index.tsx
│     ├─ lookup/                 # 기존 확장 route, 유지
│     ├─ setup/                  # 기존 확장 route, 유지
│     └─ [caseNumber]/           # 기존 사건 상세 route, 유지
│        ├─ documents/
│        ├─ guide/
│        ├─ insurance/
│        ├─ places/
│        ├─ police/
│        ├─ report/
│        └─ translation/
└─ src/
   ├─ components/
   │  ├─ common/
   │  ├─ feedback/
   │  ├─ forms/
   │  └─ layout/
   ├─ features/
   │  ├─ home/
   │  │  ├─ screens/
   │  │  │  └─ HomeScreen.tsx
   │  │  └─ views/
   │  │     ├─ HomeView.types.ts
   │  │     ├─ HomeView.tsx
   │  │     └─ HomeView.web.tsx
   │  └─ case/
   │     ├─ components/
   │     │  ├─ RecordingControl.tsx
   │     │  ├─ TranscriptCard.tsx
   │     │  ├─ QuestionCard.tsx
   │     │  └─ CaseSummaryCard.tsx
   │     ├─ context/
   │     │  └─ CaseDraftContext.tsx
   │     ├─ hooks/
   │     │  └─ useCaseDraft.ts
   │     ├─ screens/
   │     │  ├─ VoiceInputScreen.tsx
   │     │  ├─ ReviewScreen.tsx
   │     │  ├─ QuestionsScreen.tsx
   │     │  └─ ConfirmationScreen.tsx
   │     ├─ views/
   │     │  ├─ VoiceInputView.types.ts
   │     │  ├─ VoiceInputView.tsx
   │     │  ├─ VoiceInputView.web.tsx
   │     │  ├─ ReviewView.types.ts
   │     │  ├─ ReviewView.tsx
   │     │  ├─ ReviewView.web.tsx
   │     │  ├─ QuestionsView.types.ts
   │     │  ├─ QuestionsView.tsx
   │     │  ├─ QuestionsView.web.tsx
   │     │  ├─ ConfirmationView.types.ts
   │     │  ├─ ConfirmationView.tsx
   │     │  └─ ConfirmationView.web.tsx
   │     ├─ services/
   │     │  ├─ caseFlow.ts
   │     │  ├─ mockCaseFlow.ts
   │     │  └─ apiCaseFlow.ts
   │     └─ types/
   │        └─ caseDraft.ts
   ├─ mocks/
   │  └─ caseDraftFixture.ts
   └─ services/
      └─ device/
         ├─ audioRecorder.ts
         └─ location.ts
```

`app/_layout.tsx`는 앱 전체 Stack과 `CaseDraftProvider`를 설정하는 루트
layout이다. `app/case/_layout.tsx`는 `/case/*` 화면 묶음의 Stack을 설정한다.
둘은 적용 범위가 다르므로 모두 필요하다.

트리의 `new/index.tsx` 같은 표기는 `new` 폴더 안에 `index.tsx`가 있다는
뜻이다. 빈 폴더에 들어 있는 `.gitkeep`은 실제 route 파일이 생기기 전까지
폴더를 Git에 보존하기 위한 파일이며, route로 동작하지 않는다.

`.web.tsx` 파일은 웹 담당자가 만든다. 내가 웹 화면을 완성하기 위해 해당 파일에 JSX와 스타일을 대신 작성하지 않는다.

웹 파일이 아직 없을 때 Expo Web은 기본 `.tsx` 앱 View를 임시로 보여줄 수 있다. 따라서 앱 기능 개발과 웹 화면 작업이 서로를 기다리지 않고 진행될 수 있다.

---

## 4. 각 파일의 책임

### route 파일

`app/**/index.tsx`는 Screen만 반환한다.

```tsx
import { ReviewScreen } from "@/features/case/screens/ReviewScreen";

export default function ReviewRoute() {
  return <ReviewScreen />;
}
```

route에는 다음을 넣지 않는다.

- 큰 JSX
- API 요청
- 녹음 로직
- form 상태
- StyleSheet

### Screen

Screen은 기능을 담당한다.

- Context에서 draft 읽기
- 로컬 처리 상태 관리
- device service 호출
- case flow service 호출
- 입력 검증
- 오류 변환
- 다음·이전 화면 이동
- View props 구성

Screen은 가능한 한 스타일을 갖지 않는다.

```tsx
export function ReviewScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useCaseDraft();

  async function handleAnalyze() {
    // 검증, service 호출, draft 갱신, 화면 이동
  }

  return (
    <ReviewView
      statement={draft.statement}
      onAnalyze={handleAnalyze}
      onBack={() => router.back()}
      onStatementChange={(statement) => updateDraft({ statement })}
    />
  );
}
```

### View types

`*View.types.ts`는 앱 View와 웹 View가 함께 지킬 계약이다.

- 화면에 표시할 문자열
- 표시할 배열과 item 타입
- 상태 boolean 또는 명확한 상태 union
- 입력 변경 함수
- 버튼 이벤트 함수

View가 Context, Router, API를 직접 사용하지 않아도 되도록 필요한 값을 모두 props로 제공한다.

### 기본 View

`*View.tsx`는 Android·iOS 앱 UI를 담당한다.

- React Native View·Text·Pressable·TextInput 사용
- Safe Area와 작은 기기 대응
- 앱 터치 영역과 키보드 대응
- 전달받은 props 표시
- 전달받은 이벤트 호출

기본 View에도 API, Context, Router를 넣지 않는다.

### 웹 View

`*View.web.tsx`는 웹 담당자가 같은 props 타입으로 작성한다. Screen은 플랫폼별 파일을 직접 구분하지 않는다.

```tsx
import { HomeView } from "@/features/home/views/HomeView";
```

위 extension 없는 import 하나로 Android·iOS에서는 `HomeView.tsx`, 웹에서는 `HomeView.web.tsx`가 선택된다.

---

## 5. 작업 시작과 검사 명령

프로젝트 루트에서 실행한다.

```powershell
git branch --show-current
```

```powershell
git status --short
```

현재 다른 사람이 수정한 파일을 되돌리지 않는다. 현재 상태에는 `EXPO_WEB_FRONTEND_GUIDE.md`가 새 파일로 존재하므로 작업 중 삭제하지 않는다.

패키지 설치:

```powershell
pnpm.cmd install
```

현재 typecheck:

```powershell
pnpm.cmd --filter mobile typecheck
```

앱 실행:

```powershell
pnpm.cmd --filter mobile dev
```

Android:

```powershell
pnpm.cmd --filter mobile android
```

웹은 기능 연결 확인용으로만 실행할 수 있다.

```powershell
pnpm.cmd --filter mobile web
```

앱 UI의 최종 확인은 Android 또는 iOS에서 한다.

---

## 6. 1단계 — 플랫폼 View 경계부터 만들기

새 기능을 추가하기 전에 S01과 현재 S02를 Screen과 View로 분리한다. 이 작업이 끝나야 웹 담당자가 기능 파일을 건드리지 않고 화면 작업을 시작할 수 있다.

### 6.1 S01 분리

현재 `HomeScreen.tsx`에 있는 책임:

- 사건 시작과 draft 초기화
- Router 이동
- 준비 중 Alert
- 전체 UI와 StyleSheet

분리 후:

```text
HomeScreen.tsx       기능·Router·Alert
HomeView.types.ts    props 계약
HomeView.tsx         현재 앱 UI와 StyleSheet
HomeView.web.tsx     웹 담당자가 작성
```

`HomeViewProps` 최소 계약:

```tsx
export type HomeViewProps = {
  onStartCase: () => void;
  onPreviousCase: () => void;
  onDocuments: () => void;
  onGuide: () => void;
};
```

`HomeScreen`은 현재 handler를 유지하고 View에 전달한다.

```tsx
return (
  <HomeView
    onDocuments={handleDocumentsTab}
    onGuide={handleGuideTab}
    onPreviousCase={handlePreviousCase}
    onStartCase={handleStartCase}
  />
);
```

현재 HomeScreen의 JSX와 StyleSheet는 `HomeView.tsx`로 이동한다. 동작 자체는 바꾸지 않는다.

### 6.2 S02 분리

현재 `VoiceInputScreen.tsx`의 UI를 `VoiceInputView.tsx`로 옮기고 props 계약을 만든다.

처음 계약에 포함할 값:

```tsx
export type RecordingState =
  | "idle"
  | "requestingPermission"
  | "recording"
  | "stopping"
  | "processing"
  | "error";

export type VoiceInputViewProps = {
  statement: string;
  inputMode: "voice" | "text";
  recordingState: RecordingState;
  recordingTimeLabel: string;
  locationText: string;
  localTimeText: string;
  errorMessage: string | null;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  onInputModeChange: (mode: "voice" | "text") => void;
  onRecordAgain: () => void;
  onRecordStart: () => void;
  onRecordStop: () => void;
  onStatementChange: (value: string) => void;
};
```

실제 구현 중 필요한 이름은 바뀔 수 있지만, 변경할 때 앱 View와 웹 담당자에게 같은 계약을 전달한다.

### 6.3 이 단계 완료 기준

- S01의 기존 동작이 그대로 유지된다.
- S02의 현재 임시 문장이 앱 View에 표시된다.
- Screen에는 StyleSheet가 없다.
- View에는 Router, Context, API import가 없다.
- `pnpm.cmd --filter mobile typecheck`가 통과한다.
- 웹 담당자에게 다섯 View 파일 위치와 types 위치를 전달할 수 있다.

이 시점에 첫 커밋을 만든다.

```text
refactor: 앱 기능과 플랫폼 View 경계 분리
```

---

## 7. 2단계 — mock fixture와 기능 interface

기기 기능과 API를 화면 안에 직접 작성하기 전에 교체 가능한 경계를 만든다.

### 7.1 가짜 사건 fixture

`src/mocks/caseDraftFixture.ts`에 실제 개인정보가 아닌 시나리오를 둔다.

```text
장소: 일본 도쿄 신주쿠역 주변
사건 설명: 신주쿠역에서 지갑을 잃어버림
물품: 검은색 가죽 지갑, 신용카드
추가 질문: 마지막 확인 장소, 지갑 특징, 긴급 물품 여부
사건 유형: 분실
위험도: 중간
```

fixture는 화면 코드에 문자열을 반복해서 넣지 않기 위해 사용한다.

### 7.2 case flow interface

`src/features/case/services/caseFlow.ts`에서 Screen이 호출할 기능을 정의한다.

필요한 기능:

- 음성 처리 또는 mock 문장 반환
- 사건 내용 분석과 질문 목록 반환
- 답변을 반영한 사건 카드 생성
- 사건 draft 저장

개념적 형태:

```tsx
export type CaseFlow = {
  analyzeStatement: (
    input: AnalyzeStatementInput,
  ) => Promise<AnalyzeStatementResult>;
  buildCaseSummary: (
    input: BuildCaseSummaryInput,
  ) => Promise<CaseSummaryResult>;
  saveDraft: (
    draft: CaseDraft,
  ) => Promise<SaveDraftResult>;
};
```

Screen은 `mockCaseFlow` 또는 `apiCaseFlow` 중 어떤 구현인지 몰라도 같은 함수를 호출해야 한다.

### 7.3 mock service

`mockCaseFlow.ts`에는 다음을 둔다.

- 짧은 처리 지연
- 성공 결과
- 분석 실패 전환 옵션
- 저장 실패 전환 옵션
- fixture 기반 질문과 사건 카드

개발 중 오류 UI를 확인하기 위한 옵션이지 실제 오류를 숨기는 fallback으로 사용하지 않는다.

### 7.4 기기 service interface

`src/services/device/audioRecorder.ts`:

- 권한 확인·요청
- 녹음 시작
- 녹음 중지
- 녹음 취소·정리
- 권한 거부와 기기 오류를 앱 오류로 변환

`src/services/device/location.ts`:

- 위치 권한 확인·요청
- 현재 좌표 조회
- 화면 표시용 위치 변환 경계
- 권한 거부와 timeout 처리

Screen이 Expo 라이브러리의 원시 객체 전체를 직접 다루지 않게 한다.

---

## 8. 3단계 — S02 기능과 앱 UI 완성

현재 S02는 임시 문장을 넣는 버튼만 있으므로 아래 기능을 추가한다.

### 8.1 Screen 상태

`VoiceInputScreen`에서 관리할 처리 상태:

- 녹음 대기
- 권한 요청 중
- 녹음 중
- 녹음 정지 중
- 음성 처리 중
- 텍스트 입력 모드
- 권한 거부
- 녹음 오류

사건 문장·위치·시간은 이미 있는 `CaseDraftContext`에 저장한다. 녹음 버튼이 눌린 순간 같은 짧은 UI 상태는 Screen의 로컬 상태로 관리할 수 있다.

### 8.2 실제 녹음

Expo SDK 버전에 맞는 녹음 패키지를 설치하고 `audioRecorder.ts` 뒤에 연결한다.

SDK 54의 공식 녹음 API와 설정은 [Expo Audio SDK 54 문서](https://docs.expo.dev/versions/v54.0.0/sdk/audio/)를 기준으로 한다.

설치 명령은 프로젝트 루트에서 Expo가 호환 버전을 선택하게 실행한다.

```powershell
pnpm.cmd --filter mobile exec expo install expo-audio
```

`apps/mobile/app.json`의 `plugins`에도 마이크 권한 설명을 추가한다. 사용자에게 실제로 보여줄 한국어 문구는 팀의 개인정보·권한 안내와 맞춘다.

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      [
        "expo-audio",
        {
          "microphonePermission": "사건 내용을 음성으로 입력하기 위해 마이크 접근이 필요합니다."
        }
      ]
    ]
  }
}
```

config plugin 설정을 바꾼 뒤 development build를 사용 중이라면 native binary를 다시 빌드해야 한다. 권한 요청과 recorder 상태는 Screen 또는 hook에서 관리하고 View에는 상태와 이벤트만 전달한다.

필수 동작:

1. 녹음이 필요한 이유를 화면에서 안내한다.
2. 사용자가 시작 버튼을 누른 뒤 권한을 요청한다.
3. 권한 허용 시 녹음을 시작한다.
4. 녹음 중 시간을 갱신한다.
5. 중지 시 recorder를 정리한다.
6. 음성 처리 service로 결과를 전달한다.
7. 인식 문장을 `draft.statement`에 저장한다.
8. 원본 음성 보관 정책이 정해지지 않았다면 영구 저장하지 않는다.

앱이 background로 이동하거나 화면이 unmount될 때 활성 녹음을 정리한다.

### 8.3 텍스트 대체 입력

- 권한 허용 여부와 관계없이 텍스트 입력 모드 제공
- `onStatementChange`를 통해 draft 갱신
- 공백을 제거한 문장이 비면 다음 진행 차단
- 오류 문구는 입력창 가까이에 표시

### 8.4 위치와 현지 시간

SDK 54의 공식 위치 API와 설정은 [Expo Location SDK 54 문서](https://docs.expo.dev/versions/v54.0.0/sdk/location/)를 기준으로 한다.

```powershell
pnpm.cmd --filter mobile exec expo install expo-location
```

이번 S01~S05 흐름은 현재 위치 한 번 조회만 필요하므로 foreground 권한만 요청한다. background 위치 권한과 지속 추적은 추가하지 않는다.

- 위치가 필요하다는 설명 뒤 권한 요청
- 허용 시 위치 조회
- 거부 또는 실패 시 직접 입력 경로 유지
- 화면 표시용 `locationText`와 API용 좌표를 구분
- `occurredAtText`는 사용자 수정이 가능한 표시값으로 유지
- API 연결 시 timezone을 포함한 ISO 값 변환 규칙을 별도로 둠

현재 `CaseDraft`에는 좌표 필드가 없으므로 실제 API에서 필요하다면 `coordinates` 같은 선택 필드를 명시적으로 추가한다. 화면 문자열에 좌표를 억지로 합치지 않는다.

### 8.5 S03 이동

진행 조건:

- `draft.statement.trim()`이 비어 있지 않음

성공 시:

```text
/case/review
```

로 이동한다.

### 8.6 S02 앱 View

`VoiceInputView.tsx`에는 `docs/USER_FLOW.md`의 S02 요소를 구현한다.

- FlowHeader
- 제목과 설명
- 큰 녹음 버튼
- 녹음 상태와 시간
- 인식 문장 카드
- 녹음 중지
- 다시 녹음
- 텍스트 입력 전환
- 현재 위치와 현지 시간
- 오프라인 안내
- 권한·녹음 오류
- 다음 단계 버튼

앱 View는 props만 사용한다.

### 8.7 S02 완료 기준

- 실제 녹음 흐름 또는 확정된 음성 처리 경계가 동작한다.
- 텍스트 입력만으로도 S03에 갈 수 있다.
- 마이크 거부 후 텍스트 입력이 가능하다.
- 위치 거부 후 직접 입력이 가능하다.
- 녹음 중 화면 이탈 시 resource가 정리된다.
- 앱 View가 Android 또는 iOS 작은 화면에서 깨지지 않는다.
- 웹 담당자가 동일한 props로 웹 View를 연결할 수 있다.

---

## 9. 4단계 — S03 녹음 내용 확인

### 9.1 route 생성

`app/case/review/index.tsx`:

```tsx
import { ReviewScreen } from "@/features/case/screens/ReviewScreen";

export default function ReviewRoute() {
  return <ReviewScreen />;
}
```

### 9.2 만들 파일

```text
src/features/case/screens/ReviewScreen.tsx
src/features/case/views/ReviewView.types.ts
src/features/case/views/ReviewView.tsx
```

`ReviewView.web.tsx`는 웹 담당자가 만든다.

### 9.3 View 계약

최소 props:

```tsx
export type ReviewViewProps = {
  statement: string;
  locationText: string;
  occurredAtText: string;
  expectedCaseTypeLabel: string;
  isEditingStatement: boolean;
  isEditingLocation: boolean;
  isEditingTime: boolean;
  isAnalyzing: boolean;
  errorMessage: string | null;
  canAnalyze: boolean;
  onAnalyze: () => void;
  onBack: () => void;
  onLocationChange: (value: string) => void;
  onLocationEditToggle: () => void;
  onOccurredAtChange: (value: string) => void;
  onRecordAgain: () => void;
  onStatementChange: (value: string) => void;
  onStatementEditToggle: () => void;
  onTimeEditToggle: () => void;
};
```

실제 이름은 구현에 맞게 정리하되 앱과 웹 View가 동일한 계약을 사용해야 한다.

### 9.4 Screen 기능

- draft에서 문장·위치·시간 읽기
- 각 수정값을 Context에 즉시 또는 저장 시 반영
- 다시 녹음 시 유지할 필드와 초기화할 필드를 명시
- 분석 버튼 중복 실행 차단
- `caseFlow.analyzeStatement()` 호출
- 성공 결과의 사건 유형과 질문 목록을 draft에 저장
- 실패 시 기존 입력 유지
- 성공 후 `/case/questions` 이동

다시 녹음 정책 권장:

- `statement` 초기화
- 질문과 분석 결과 초기화
- 사용자가 수정한 위치와 시간은 유지
- `/case/new`로 이동

### 9.5 앱 View

- `말씀해주신 내용이 맞나요?`
- ProgressBar
- 사건 문장과 수정 UI
- 위치·시간과 수정 UI
- 다시 녹음
- AI 분석 안내
- 예상 신고 유형
- 분석 버튼
- 분석 중·오류·재시도 상태

### 9.6 S03 완료 기준

- S02 입력값이 보인다.
- 수정한 값이 draft에 남는다.
- 빈 문장은 분석할 수 없다.
- 분석 중 버튼이 비활성화된다.
- 분석 실패 후 입력을 유지하고 재시도한다.
- 성공 후 질문과 사건 유형이 draft에 저장되고 S04로 이동한다.

---

## 10. 5단계 — S04 추가 질문

### 10.1 route 생성

`app/case/questions/index.tsx`:

```tsx
import { QuestionsScreen } from "@/features/case/screens/QuestionsScreen";

export default function QuestionsRoute() {
  return <QuestionsScreen />;
}
```

### 10.2 만들 파일

```text
src/features/case/screens/QuestionsScreen.tsx
src/features/case/views/QuestionsView.types.ts
src/features/case/views/QuestionsView.tsx
```

### 10.3 Screen 상태

Screen이 관리할 값:

- 현재 질문 index
- 답변 저장 중 여부
- 현재 입력 오류
- 저장 또는 분석 오류

질문과 답변 자체는 Context의 `draft.questions`와 `answerQuestion()`을 사용한다.

### 10.4 View 계약

View에는 전체 기능 상태 대신 현재 표시할 질문을 계산해 전달한다.

```tsx
export type QuestionsViewProps = {
  currentQuestion: string | null;
  currentAnswer: string;
  currentIndex: number;
  totalCount: number;
  progress: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onAnswerChange: (value: string) => void;
  onBack: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
};
```

### 10.5 기능 규칙

- 한 화면에 현재 질문 하나만 표시
- 현재 답변의 `trim()`이 비면 다음 진행 차단
- 다음·이전 이동 후에도 답변 보존
- 첫 질문에서 이전 버튼 비활성 또는 숨김
- 마지막 질문에서 `다음` 대신 완료 버튼 표시
- 완료 시 `caseFlow.buildCaseSummary()` 호출
- 성공 결과를 draft의 사건 유형·물품·위험도·상세 내용에 반영
- 성공 후 `/case/confirmation` 이동
- 질문이 없으면 오류 안내와 S03 복귀 동작 제공

### 10.6 앱 View

- FlowHeader와 ProgressBar
- AI 분석 기반 추가 질문 안내
- 현재 순서
- 현재 질문
- 답변 입력 또는 선택 UI
- 이전·다음 버튼
- 마지막 분석 버튼
- 필수 답변 오류
- 저장 중·실패·재시도 상태
- 질문 없음 상태

### 10.7 S04 완료 기준

- 질문이 한 개씩 보인다.
- 입력한 답변이 Context에 저장된다.
- 이전 질문으로 돌아가도 답변이 남는다.
- 필수 답변 없이는 다음으로 가지 않는다.
- 마지막 완료 중 중복 요청을 막는다.
- 성공 결과가 draft에 반영되고 S05로 이동한다.

---

## 11. 6단계 — S05 사건 카드 내용 확정

### 11.1 route 생성

`app/case/confirmation/index.tsx`:

```tsx
import { ConfirmationScreen } from "@/features/case/screens/ConfirmationScreen";

export default function ConfirmationRoute() {
  return <ConfirmationScreen />;
}
```

### 11.2 만들 파일

```text
src/features/case/screens/ConfirmationScreen.tsx
src/features/case/views/ConfirmationView.types.ts
src/features/case/views/ConfirmationView.tsx
```

필요하면 다음 표시 컴포넌트를 분리한다.

```text
src/features/case/components/CaseSummaryCard.tsx
src/features/case/components/CaseItemEditor.tsx
```

### 11.3 draft 타입 보완

현재 `CaseDraftItem`에는 안정적인 식별자가 없다. 물품 수정·삭제를 안전하게 처리하려면 화면용 `id`를 추가하는 것을 권장한다.

```tsx
export type CaseDraftItem = {
  id: string;
  name: string;
  category?: string;
  description?: string;
};
```

index를 React key나 영구 식별자로 사용하지 않는다. 새 물품을 만들 때 로컬 id를 생성하고, API DTO로 변환할 때 서버 계약에 맞게 처리한다.

### 11.4 View 계약

최소 props:

```tsx
export type ConfirmationViewProps = {
  caseType: "LOST" | "STOLEN" | "UNKNOWN";
  caseTypeLabel: string;
  items: CaseDraftItem[];
  occurredAtText: string;
  locationText: string;
  emergencyItemIncluded: boolean;
  riskLevelLabel: string;
  details: string;
  clues: string;
  isEditing: boolean;
  isSaving: boolean;
  isSaved: boolean;
  canConfirm: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onCaseTypeChange: (
    value: "LOST" | "STOLEN" | "UNKNOWN",
  ) => void;
  onCluesChange: (value: string) => void;
  onConfirm: () => void;
  onDetailsChange: (value: string) => void;
  onEditToggle: () => void;
  onItemAdd: () => void;
  onItemChange: (
    id: string,
    changes: Partial<CaseDraftItem>,
  ) => void;
  onItemRemove: (id: string) => void;
  onLocationChange: (value: string) => void;
  onOccurredAtChange: (value: string) => void;
};
```

### 11.5 Screen 기능

- 사건 유형 변경
- 물품 추가·수정·삭제
- 발생 시간·장소 변경
- 상세 특징·추가 단서 변경
- draft 불변성을 유지하며 배열 갱신
- 필수값 검사
- 저장 중 중복 요청 차단
- `caseFlow.saveDraft()` 호출
- 저장 실패 후 입력 유지와 재시도
- 저장 성공 상태 표시

필수값 권장:

- 사건 유형이 `UNKNOWN`이 아님
- 물품 한 개 이상
- 모든 물품 이름이 비어 있지 않음
- 발생 시간 있음
- 발생 장소 있음

### 11.6 앱 View

- 사건 내용 정리 안내
- 사건 유형과 수정
- 물품 목록과 추가·수정·삭제
- 발생 시간·장소
- 긴급 물품 여부
- 위험도
- 상세 특징
- 추가 단서
- 편집·확정 버튼
- 필수값 오류
- 저장 중·실패·성공 상태

저장 성공 문구:

```text
사건 초안이 저장되었습니다.
다음 단계는 사건번호와 비밀번호 설정입니다.
```

S06 route가 없으므로 저장 성공 후 존재하지 않는 경로로 이동하지 않는다.

### 11.7 S05 완료 기준

- S04 결과가 사건 카드에 보인다.
- 모든 수정값이 draft에 반영된다.
- 물품 배열을 직접 mutate하지 않는다.
- 필수값이 없으면 저장하지 않는다.
- 저장 중 중복 요청을 막는다.
- 실패 후 입력을 유지하고 다시 시도한다.
- 성공 안내가 보이고 S05에 머문다.

---

## 12. CaseDraftContext에서 보완할 것

현재 Context의 `updateDraft()`와 `answerQuestion()`은 기본 흐름에 사용할 수 있다. 다음 기능은 구현하면서 명시적인 action으로 추가하는 것을 검토한다.

- 분석 결과 전체 적용
- 질문과 분석 결과만 초기화
- 물품 추가
- 물품 수정
- 물품 삭제
- 저장 시작
- 저장 성공
- 저장 실패

여러 필드를 항상 함께 변경하는 동작이 늘어나면 화면마다 `updateDraft()`를 반복하기보다 action으로 묶는다.

예시:

```tsx
applyAnalysisResult(result)
resetStatementAnalysis()
addItem(item)
updateItem(id, changes)
removeItem(id)
```

Context에는 화면 표시용 JSX나 Router를 넣지 않는다.

현재 `isSaving`과 `errorMessage`가 draft에 있지만 모든 화면의 일시적인 처리 상태를 한 필드로 공유하면 이전 화면 오류가 다음 화면에 남을 수 있다. 다음 기준을 사용한다.

- 사건 전체 저장 상태: Context 가능
- 특정 화면의 일시적인 분석·권한 오류: 해당 Screen 로컬 상태
- 서버에 보존할 데이터: draft
- 단순 편집 UI 열림 여부: 해당 Screen 로컬 상태

---

## 13. 웹 담당자에게 넘길 계약

각 Screen과 앱 View가 완성되기 전에도 `*View.types.ts`가 확정되면 웹 담당자가 작업을 시작할 수 있다.

화면마다 전달할 항목:

1. View 파일 경로
2. types 파일 경로
3. 각 props의 의미
4. 화면 상태 조합
5. S01~S05 테스트 방법
6. 와이어프레임 또는 참고 화면

웹 담당자가 요청한 표시값이 View props에 없다면 내가 Screen에서 계산해 계약에 추가한다.

예시:

```text
요청: S05에서 위험도를 한글로 표시해야 함
처리: Screen이 riskLevelLabel을 계산해 View props로 전달
웹 View: riskLevelLabel만 표시
```

웹 View가 기능 코드를 직접 작성하게 두지 않는다.

```text
금지 경계:
- router.push()
- useCaseDraft()
- fetch()
- Expo 마이크·위치 import
- 질문 index 상태
- 필수값 검사
- API DTO 변환
```

기능 변경으로 props 계약이 달라지면 앱 View와 웹 담당자에게 같은 변경을 바로 공유한다.

---

## 14. 실제 API 연결 전 확인할 계약

현재 저장소의 API와 S01~S05 요구사항에는 아직 차이가 있다.

### draft 인증

현재 흐름:

```text
POST /api/cases/analyze          인증 없음, DB 저장 없음
POST /api/cases                  최종 CONFIRMED Case 생성
POST /api/cases/auth             caseNumber + password 인증
GET/PATCH /api/cases/[id]        case-access Bearer token 필요
```

사건 생성 직후 분석·수정할 인증 수단을 백엔드와 확정해야 한다.

가능한 방향:

- 생성 응답에서 짧은 수명의 draft access token 반환
- 확정 전 전용 draft session 사용

인증 계약 전에는 앱 코드에 임시 비밀값이나 우회 로직을 넣지 않는다.

### S04 답변

공유 질문 스키마에 다음이 필요하다.

- 질문 id 또는 field
- 답변 타입
- 선택지
- 필수 여부
- 질문 순서
- 답변 저장 요청
- 답변 후 재분석 규칙

### S05 저장

다음 필드가 DB·공유 Zod·API 요청에서 저장 가능한지 확인한다.

- 사건 유형
- 물품 목록
- 긴급 물품 여부
- 위험도
- 발생 시간·장소
- 상세 특징
- 추가 단서

### 응답 검증

- 성공 응답을 공유 Zod schema로 검증
- 오류 응답의 사용자 메시지와 내부 로그 분리
- JSON 파싱·네트워크·HTTP·schema 오류 구분
- 실제 개인정보를 개발 로그에 출력하지 않음

계약이 정리되기 전에는 `mockCaseFlow`로 S01~S05 전체 흐름을 먼저 완성한다.

---

## 15. 구현 순서 요약

현재 시점부터 다음 순서로 진행한다.

### 작업 1 — S01·S02 구조 분리

- [ ] `HomeView.types.ts` 생성
- [ ] `HomeView.tsx`로 기존 S01 UI 이동
- [ ] `HomeScreen.tsx`에 기능과 handler만 유지
- [ ] `VoiceInputView.types.ts` 생성
- [ ] `VoiceInputView.tsx`로 기존 S02 UI 이동
- [ ] `VoiceInputScreen.tsx`에 상태와 기능만 유지
- [ ] typecheck

### 작업 2 — mock과 device 경계

- [ ] `caseDraftFixture.ts`
- [ ] `caseFlow.ts`
- [ ] `mockCaseFlow.ts`
- [ ] `audioRecorder.ts`
- [ ] `location.ts`
- [ ] 성공·실패 테스트 옵션

### 작업 3 — S02 완성

- [ ] 녹음 상태
- [ ] 마이크 권한
- [ ] 실제 녹음 시작·중지·정리
- [ ] 음성 처리 경계
- [ ] 텍스트 입력
- [ ] 위치 권한과 직접 입력 fallback
- [ ] S03 이동 검증
- [ ] 앱 UI QA

### 작업 4 — S03

- [ ] route
- [ ] Screen
- [ ] View types
- [ ] 앱 View
- [ ] 내용·위치·시간 수정
- [ ] 분석 중·실패·재시도
- [ ] 질문 저장과 S04 이동

### 작업 5 — S04

- [ ] route
- [ ] Screen
- [ ] View types
- [ ] 앱 View
- [ ] 질문 한 개씩 표시
- [ ] 답변 유지
- [ ] 필수값 검사
- [ ] 사건 카드 결과와 S05 이동

### 작업 6 — S05

- [ ] route
- [ ] Screen
- [ ] View types
- [ ] 앱 View
- [ ] 사건 유형 수정
- [ ] 물품 추가·수정·삭제
- [ ] 시간·장소·상세 정보 수정
- [ ] 필수값 검사
- [ ] 저장 중·실패·재시도·성공

### 작업 7 — 통합 QA

- [ ] S01→S05 순방향 이동
- [ ] 뒤로 가기와 입력 보존
- [ ] 앱 종료·화면 이탈 시 녹음 정리
- [ ] 마이크 권한 거부
- [ ] 위치 권한 거부
- [ ] 분석 실패
- [ ] 질문 없음
- [ ] 저장 실패
- [ ] 작은 기기와 키보드
- [ ] Android 또는 iOS 실기기
- [ ] 웹 View와 동일 props 계약 확인

---

## 16. 권장 커밋 순서

### 커밋 1

```text
refactor: 앱 기능과 플랫폼 View 경계 분리
```

- S01·S02 Screen/View 분리
- View props 계약
- 기존 동작 보존

### 커밋 2

```text
feat: 사건 입력 device 및 mock service 기반 추가
```

- fixture
- caseFlow interface
- audio와 location interface
- mock adapter

### 커밋 3

```text
feat: S02 음성 및 텍스트 입력 흐름 구현
```

- 녹음·권한·텍스트·위치
- 앱 View
- S03 이동

### 커밋 4

```text
feat: S03 사건 내용 확인과 분석 구현
```

### 커밋 5

```text
feat: S04 추가 질문 흐름 구현
```

### 커밋 6

```text
feat: S05 사건 카드 확인과 저장 구현
```

### 커밋 7

```text
fix: S01~S05 앱 흐름 QA 반영
```

각 커밋 전 확인:

```powershell
pnpm.cmd --filter mobile typecheck
```

```powershell
git diff --check
```

기능 단위가 완료되기 전에도 웹 담당자가 필요한 `*View.types.ts`는 먼저 합의할 수 있다. 단, 실제로 동작하지 않는 계약을 완료된 것처럼 전달하지 않는다.

---

## 17. 최종 체크리스트

### 구조와 역할

- [ ] Route는 Screen만 렌더링한다.
- [ ] Screen이 기능·상태·검증·Router를 담당한다.
- [ ] 기본 View가 앱 UI만 담당한다.
- [ ] `.web.tsx`는 웹 담당자 파일이다.
- [ ] 앱과 웹 View가 같은 props 타입을 사용한다.
- [ ] View가 Context·Router·API·device service를 직접 사용하지 않는다.

### S01~S05 기능

- [ ] S01에서 새 사건을 시작하면 draft가 초기화된다.
- [ ] S02에서 녹음 또는 텍스트 입력이 가능하다.
- [ ] 마이크·위치 권한 거부에 대체 흐름이 있다.
- [ ] S03에서 문장·위치·시간을 수정한다.
- [ ] S03 분석 실패 후 입력을 유지한다.
- [ ] S04 질문과 답변이 보존된다.
- [ ] S05의 모든 사건 카드 필드를 수정한다.
- [ ] S05 저장 실패 후 입력을 유지한다.
- [ ] S05 저장 성공 후 다음 단계 안내를 표시한다.

### 상태와 안정성

- [ ] 처리 중 중복 요청을 막는다.
- [ ] 화면을 떠날 때 녹음 resource를 정리한다.
- [ ] 오류가 발생한 입력과 가까운 곳에 안내한다.
- [ ] 실제 개인정보를 fixture·로그·URL에 넣지 않는다.
- [ ] 뒤로 가기 후 draft 유지 정책이 일관적이다.
- [ ] Android 또는 iOS 실기기에서 전체 흐름을 확인한다.

### 검사

- [ ] `pnpm.cmd --filter mobile typecheck`
- [ ] `git diff --check`
- [ ] S01→S05 전체 수동 실행
- [ ] 권한 거부·분석 실패·저장 실패 수동 실행
- [ ] 웹 담당자의 `.web.tsx`가 같은 types 계약으로 typecheck 통과

---

## 18. 지금 바로 시작할 일

1. 현재 코드에서 S01과 S02가 실행되는지 다시 확인한다.
2. `views` 폴더를 만들고 S01을 `HomeScreen + HomeView.types + HomeView`로 분리한다.
3. 같은 방식으로 S02를 `VoiceInputScreen + VoiceInputView.types + VoiceInputView`로 분리한다.
4. 두 Screen에 남은 StyleSheet와 큰 JSX가 없는지 확인한다.
5. 두 View에 Router·Context import가 없는지 확인한다.
6. typecheck 후 첫 refactor 커밋을 만든다.
7. S03~S05의 View props 계약 초안을 만든다.
8. 웹 담당자에게 `EXPO_WEB_FRONTEND_GUIDE.md`와 각 types 경로를 전달한다.
9. 나는 mock·audio·location 경계를 만들고 S02 기능을 완성한다.
10. S03, S04, S05를 순서대로 구현한다.
11. mock 흐름 전체가 안정되면 합의된 실제 API adapter를 연결한다.
12. Android 또는 iOS에서 S01부터 S05까지 전체 흐름과 오류 상태를 확인한다.
