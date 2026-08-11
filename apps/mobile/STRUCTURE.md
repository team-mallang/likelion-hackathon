# 모바일 S01~S06 라우트 및 소스 구조

## 목적과 현재 범위

이 문서는 `docs/USER_FLOW.md`에서 상세 정의가 끝난 S01~S06을 모바일 앱으로 구현하기 위한 구조 기준이다.

- 이번 구현 범위: S01 홈 → S02 음성 입력 → S03 녹음내용 확인 → S04 추가 질문 → S05 사건카드 내용 확정 → S06 사건번호 발급·비밀번호 설정
- 다음 범위: 상세 UX가 아직 확정되지 않은 S07 이후 화면
- S07~S20은 화면 이름만 정해졌으므로 와이어프레임이 확정되기 전에는 라우트와 데이터 구조를 고정하지 않는다.
- S05 저장 성공 시 S06으로 이동하고, S06 비밀번호 설정 성공 후에는 다음 행동 가이드 route가 정의될 때까지 완료 상태를 표시한다.

## 현재 저장소 상태

| 구분 | 상태 |
|---|---|
| Expo Router·TypeScript 설정 | 완료 |
| S01 라우트 파일 | `app/index.tsx`에 임시 화면만 존재 |
| S02~S05 라우트 디렉터리 | 디렉터리와 `.gitkeep`만 존재 |
| 디자인 토큰 | `src/theme/tokens.ts`에 최소 색상·간격·radius 존재 |
| 공통 UI | `Button`, `AppTextInput`, `LoadingState`, `ErrorState` 존재 |
| 화면 공통 레이아웃 | 미구현 |
| S01~S05 실제 화면 | 미구현 |
| 화면 간 사건 초안 상태 | 미구현 |
| 마이크·위치 연동 | 패키지·권한·adapter 모두 미구현 |
| 모바일 API client | 미구현 |
| 사건 API·공유 Zod 스키마 | 일부 구현됐지만 S01~S05 전체 흐름과 계약 불일치 존재 |

## 구조 원칙

- `app`은 Expo Router 경로 선언과 provider 조합만 담당한다.
- 화면 UI와 상호작용은 `src/features`의 screen 컴포넌트에 둔다.
- S02~S05에서 공유하는 입력은 `CaseDraftProvider` 한 곳에서 관리한다.
- 첫 구현은 확정된 mock fixture로 화면 5개의 세로 흐름을 완성한다.
- device와 API 연동은 interface 뒤에 두어 mock을 실제 구현으로 교체할 수 있게 한다.
- API 응답을 사용할 때는 `@project/shared`의 Zod 스키마로 경계에서 검증한다.
- 비밀번호, 실제 여권번호, 실제 연락처 등 민감정보를 fixture·로그·URL에 넣지 않는다.
- 각 화면은 정상 상태뿐 아니라 입력 없음, 처리 중, 실패, 재시도 상태를 가진다.

## S01~S05 확정 라우트

| 화면 | 경로 | 라우트 파일 | screen 컴포넌트 | 책임 |
|---|---|---|---|---|
| S01 홈 | `/` | `app/index.tsx` | `HomeScreen` | 새 사건 시작, 이전 사건 조회 진입 |
| S02 음성 입력 | `/case/new` | `app/case/new/index.tsx` | `VoiceInputScreen` | 녹음 상태, 인식 문장, 위치·현지 시간, 텍스트 대체 입력 |
| S03 녹음내용 확인 | `/case/review` | `app/case/review/index.tsx` | `RecordingReviewScreen` | 사건 설명·위치·발생 시간 확인과 수정, 분석 요청 |
| S04 추가 질문 | `/case/questions` | `app/case/questions/index.tsx` | `AdditionalQuestionScreen` | AI 질문을 한 번에 하나씩 표시하고 답변 저장 |
| S05 사건카드 내용 확정 | `/case/confirmation` | `app/case/confirmation/index.tsx` | `CaseConfirmationScreen` | 사건 유형·물품·시간·장소·위험도·단서 확인과 수정 |
| S06 사건번호·비밀번호 설정 | `/case/access` | `app/case/access/index.tsx` | `CaseAccessScreen` | 발급 사건번호 보관 안내, 복사, 비밀번호 검증·설정 |

S19 이전 사건 정보입력 화면은 아직 상세 정의 전이므로 S01의 `이전 사건 조회` 버튼은 이번 범위에서 준비 중 안내만 표시한다. 임의의 과거 `/case/lookup` 흐름을 새 설계로 간주하지 않는다.

## 화면 이동

```text
S01 홈
└── 사건 발생·가이드 시작 → S02 음성 입력

S02 음성 입력
├── 뒤로가기 → S01
├── 녹음 중지 + 인식 내용 있음 → S03
└── 텍스트 입력 → S02 내부 직접 입력 모드

S03 녹음내용 확인
├── 뒤로가기·다시 녹음 → S02
└── 분석 성공 → S04

S04 추가 질문
├── 뒤로가기 → S03
├── 답변 저장 → 다음 질문 1개 표시
└── 마지막 필수 답변 완료 → S05

S05 사건카드 내용 확정
├── 뒤로가기 → S04
├── 각 항목 수정 → S05 내부 편집 상태
└── 사건 내용 확정·저장 성공 → S06

S06 사건번호 발급·비밀번호 설정
├── 뒤로가기 → S05
├── 사건번호 복사 → S06 내부 복사 완료 상태
└── 비밀번호 설정 성공 → S06 완료 상태
                           (행동 가이드 route 구현 후 연결)
```

## 라우트 디렉터리

```text
apps/mobile/
├── app/
│   ├── _layout.tsx                         # 전역 Stack 설정
│   ├── index.tsx                           # S01 route wrapper
│   └── case/
│       ├── _layout.tsx                     # CaseDraftProvider + 사건 생성 Stack
│       ├── new/
│       │   └── index.tsx                   # S02 route wrapper
│       ├── review/
│       │   └── index.tsx                   # S03 route wrapper
│       ├── questions/
│       │   └── index.tsx                   # S04 route wrapper
│       ├── confirmation/
│       │   └── index.tsx                   # S05 route wrapper
│       └── access/
│           └── index.tsx                   # S06 route wrapper
└── src/
```

각 route wrapper는 screen을 import해 반환하는 역할만 맡는다.

```tsx
import { VoiceInputScreen } from "@/features/case/screens/VoiceInputScreen";

export default function VoiceInputRoute() {
  return <VoiceInputScreen />;
}
```

## 소스 디렉터리

```text
src/
├── components/
│   ├── common/
│   │   └── button.tsx                     # 기존 공통 버튼
│   ├── feedback/
│   │   ├── ErrorState.tsx
│   │   └── LoadingState.tsx
│   ├── forms/
│   │   └── AppTextInput.tsx
│   └── layout/
│       ├── AppScreen.tsx                  # SafeArea·스크롤·하단 고정 버튼 영역
│       ├── FlowHeader.tsx                 # 뒤로가기·제목·단계
│       └── ProgressBar.tsx                # S03·S04 진행 표시줄
├── features/
│   ├── home/
│   │   └── screens/
│   │       └── HomeScreen.tsx             # S01
│   └── case/
│       ├── components/
│       │   ├── RecordingControl.tsx       # S02 녹음 버튼·상태·타이머
│       │   ├── TranscriptCard.tsx         # S02·S03 인식 내용
│       │   ├── QuestionCard.tsx           # S04 현재 질문과 답변
│       │   └── CaseSummaryCard.tsx        # S05 사건카드
│       ├── context/
│       │   └── CaseDraftContext.tsx       # S02~S05 입력과 action
│       ├── hooks/
│       │   └── useCaseDraft.ts
│       ├── screens/
│       │   ├── VoiceInputScreen.tsx       # S02
│       │   ├── RecordingReviewScreen.tsx  # S03
│       │   ├── AdditionalQuestionScreen.tsx # S04
│       │   └── CaseConfirmationScreen.tsx # S05
│       ├── services/
│       │   ├── caseFlow.ts                # 화면이 의존할 interface
│       │   ├── mockCaseFlow.ts            # 첫 구현용 adapter
│       │   └── apiCaseFlow.ts             # 계약 정리 후 실제 API adapter
│       └── types/
│           └── caseDraft.ts               # 화면 전용 draft·상태 타입
├── mocks/
│   └── caseDraftFixture.ts                # 가짜 분실 사건 시나리오
├── services/
│   ├── api/                               # base URL·fetch·오류 변환
│   └── device/
│       ├── audioRecorder.ts               # 마이크 interface와 구현
│       └── location.ts                    # 위치 interface와 구현
└── theme/
    └── tokens.ts
```

## 사건 초안 상태

S02~S05에서는 서버 응답 객체를 화면 상태로 직접 사용하지 않는다. 다음 화면용 draft를 별도로 두고 API 요청 직전에 DTO로 변환한다.

```ts
type CaseDraft = {
  statement: string;
  inputMode: "voice" | "text";
  locationText: string;
  occurredAtText: string;
  questions: Array<{
    field: string;
    question: string;
    answer: string;
  }>;
  caseType: "LOST" | "STOLEN" | "UNKNOWN";
  items: Array<{
    name: string;
    category?: string;
    description?: string;
  }>;
  emergencyItemIncluded: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  details: string;
  clues: string;
};
```

`locationText`와 `occurredAtText`는 와이어프레임 표시용 값이다. 실제 API 연결 시 ISO 날짜와 구조화 위치로 변환하는 규칙을 공유 계약에 추가한다.

## 화면별 상태 기준

| 화면 | 최소 상태 |
|---|---|
| S01 | 기본, 준비 중 안내 |
| S02 | 녹음 대기, 녹음 중, 중지, 텍스트 입력, 권한 거부, 녹음 오류 |
| S03 | 보기, 내용 편집, 위치 편집, 시간 편집, 분석 중, 분석 오류 |
| S04 | 질문 로딩, 현재 질문, 필수 답변 오류, 다음 질문, 저장 오류 |
| S05 | 보기, 항목 편집, 저장 중, 필수값 오류, 저장 성공, 저장 오류 |

처리 중에는 주요 버튼의 중복 탭을 막고, 오류 뒤에는 사용자가 입력한 draft를 유지한다.

## mock과 실제 연동 경계

첫 구현에서는 아래 기능을 `mockCaseFlow`가 제공한다.

- S02 음성 인식 결과 문장
- 현재 위치와 현지 시간
- S03 분석 결과와 S04 추가 질문 목록
- 질문 답변 반영 결과
- S05 사건카드 요약과 저장 성공·실패 상태

실제 연동 전 해결해야 할 계약 차이:

1. `POST /api/cases/analyze`는 인증과 DB 저장 없이 분석하고, 사용자 확인 후 `POST /api/cases`로 최종 Case를 생성한다. 이후 `POST /api/cases/auth`에서 받은 case-access JWT로 `PATCH /api/cases/[id]`를 호출한다.
2. `caseAnalysisQuestionSchema`에는 질문만 있고 S04 답변을 저장하는 요청 계약이 없다.
3. `updateCaseSchema`에는 S05에서 수정하는 물품 목록·긴급 물품·위험도·상세 단서 전체를 반영할 계약이 없다.
4. `docs/API.md`가 현재 구현된 사건 API를 문서화하지 않았다.

이 네 가지가 합의되기 전에는 화면에서 실제 endpoint를 직접 호출하지 않는다.

## 구현 순서

1. `AppScreen`, `FlowHeader`, `ProgressBar` 구현
2. S01~S05 route wrapper와 `app/case/_layout.tsx` 생성
3. `CaseDraftProvider`, fixture, `mockCaseFlow` 구현
4. S01을 와이어프레임대로 교체하고 S02 이동 연결
5. S02 UI와 mock 녹음 상태·텍스트 대체 입력 구현
6. S03 편집·분석 상태와 S04 이동 구현
7. S04 질문 1개씩 표시·답변 보존 구현
8. S05 사건카드·수정·저장 상태 구현
9. Android 또는 iOS 실기기에서 뒤로가기와 입력 보존 검증
10. API 계약 정리 후 실제 audio·location·API adapter를 순차 연결

## 이번 범위 완료 조건

- [ ] S01~S05 route 파일이 실제 screen 컴포넌트와 연결됨
- [ ] S01 → S02 → S03 → S04 → S05를 mock 데이터로 이동 가능
- [ ] S02에서 음성 mock과 텍스트 대체 입력을 모두 시연 가능
- [ ] S03의 사건 내용·위치·시간 수정값이 뒤로 이동 후에도 보존됨
- [ ] S04 질문이 한 번에 하나씩 표시되고 이전 답변이 보존됨
- [ ] S05에서 사건 유형·물품·시간·장소·상세 정보 수정 가능
- [ ] 로딩·필수 입력 오류·처리 실패·재시도 상태가 빈 화면 없이 표시됨
- [ ] S05 저장 성공 후 S06으로 이동하고 사건번호가 표시됨
- [ ] S06 비밀번호가 Context·URL·로그에 남지 않음
- [ ] 실제 개인정보가 fixture와 로그에 없음
- [ ] `pnpm.cmd --filter mobile typecheck` 통과
- [ ] Android 또는 iOS 기기에서 핵심 흐름 확인
- [ ] `git diff --check` 통과
