# S07 서류 허브 화면 구현 가이드

이 문서는 S07 `서류` 화면을 제공된 와이어프레임과 `docs/USER_FLOW.md`의 계약에 맞춰 구현하기 위한 작업 순서다. 완료된 S01~S06 구현 내용은 다루지 않는다.

현재 단계에서는 **구현 순서만 확정**한다. 이 문서를 작성하는 동안 route, Screen, View, service 등 실제 앱 코드는 수정하지 않는다.

---

## 1. 목표와 범위

S07은 현재 사건의 신고 진행 상황, 작성된 서류, 업로드된 증빙 자료를 한곳에서 확인하는 서류 허브다.

이번 구현 범위:

- 상단 `서류` 헤더
- 사건번호, `신고 완료` badge, 사건 가이드 링크
- 신고 처리 진행률 숫자와 ProgressBar
- `작성된 서류` 목록
- `증빙 자료` 목록
- 사건번호 복사
- 문서 보기·증빙 공유 이벤트의 Screen 경계
- 조회 중·빈 값·오류·처리 중 상태
- `사건 / 가이드 / 서류` 하단 내비게이션
- Expo Router route 생성
- 활성 사건이 있을 때 S01의 `서류` 진입점 연결
- 앱·웹이 함께 사용할 View props 계약

이번 구현에서 제외할 항목:

- S08 사건카드 상세 화면 자체 구현
- S09 경찰서 신고서 초안 화면 자체 구현
- S11 행동 가이드 화면 자체 구현
- S15·S16 신고서 촬영·등록 기능
- 실제 PDF 생성과 다운로드
- 실제 이메일 전송
- backend API가 정해지지 않은 파일 업로드·보관 정책

미구현 화면으로 `router.push()`하지 않는다. 후속 route가 생기기 전까지는 Screen에서 `준비 중` 안내를 제공한다.

---

## 2. 구현 전 현재 구조 확인

현재 저장소 상태는 다음과 같다.

- S07 route와 documents feature가 아직 없다.
- 사건 draft는 전역 `CaseDraftProvider`에서 유지된다.
- `CaseDraft`에는 `caseId`, `caseNumber`, `savedAt`이 있지만 문서·증빙 목록과 처리 진행률은 없다.
- 사건번호 formatter가 `CaseAccessScreen.tsx` 내부 함수로만 존재한다.
- 공통 `ProgressBar`는 `0~1` 값을 받고 접근성 진행률도 제공한다.
- 별도의 아이콘 package가 직접 dependency로 선언되어 있지 않다.
- S08·S09·S11 route는 아직 존재하지 않는다.
- S01의 서류 버튼은 현재 항상 `활성 사건 없음` 안내를 표시한다.

따라서 S07 화면 데이터를 `CaseDraft`에 억지로 추가하지 않고, 서류 화면 전용 조회 모델과 service 경계를 먼저 만든다.

---

## 3. 목표 파일 구조

구현 시 다음 구조를 기준으로 한다.

```text
apps/mobile/app/case/documents/index.tsx

apps/mobile/src/features/documents/
  screens/
    DocumentsScreen.tsx
  services/
    documents.ts
    mockDocuments.ts
  types/
    documents.ts
  views/
    DocumentsView.tsx
    DocumentsView.types.ts
    DocumentsView.web.tsx        # 웹 구현을 같은 작업에서 진행할 경우

apps/mobile/src/features/case/utils/
  formatCaseNumber.ts
```

화면 JSX가 지나치게 길어질 때만 다음 전용 컴포넌트를 추가한다.

```text
apps/mobile/src/features/documents/components/
  CaseStatusCard.tsx
  DocumentListCard.tsx
  CaseBottomNavigation.tsx
```

한 번만 쓰는 작은 View를 처음부터 과도하게 분리하지 않는다. 분리하더라도 Router, Context, Clipboard, Share API는 컴포넌트에서 직접 호출하지 않는다.

---

## 4. 1단계 — 데이터 모델과 View 계약 확정

가장 먼저 S07이 표시할 데이터와 이벤트를 타입으로 고정한다. UI부터 만들고 fixture 형태에 맞춰 타입을 뒤늦게 바꾸지 않는다.

### 4.1 서류 화면 전용 데이터 타입

`features/documents/types/documents.ts`에 다음 성격의 타입을 만든다.

```ts
type DocumentStatus = "READY" | "GENERATING" | "FAILED";

type GeneratedDocument = {
  id: string;
  kind: "CASE_CARD" | "POLICE_REPORT_DRAFT";
  title: string;
  description: string;
  status: DocumentStatus;
};

type EvidenceFile = {
  id: string;
  kind: "POLICE_REPORT_PHOTO";
  title: string;
  description: string;
  registeredAt: string;
  deliveryDescription: string | null;
  localUri: string | null;
};

type DocumentsOverview = {
  caseId: string;
  caseNumber: string;
  reportStatusLabel: string;
  progressPercent: number;
  documents: GeneratedDocument[];
  evidenceFiles: EvidenceFile[];
};
```

규칙:

- 날짜는 service 경계에서는 ISO 문자열로 받고 Screen에서 사용자용 문구로 변환한다.
- `progressPercent`는 Screen에서 `0~100`으로 제한한다.
- `localUri`가 없으면 실제 파일 공유를 시도하지 않는다.
- 제목·설명을 enum에서 View가 임의 생성하지 않는다. Screen이 표시 문자열을 전달한다.
- 배열 key는 index가 아니라 안정적인 `id`를 사용한다.

### 4.2 `DocumentsViewProps`

`DocumentsView.types.ts`에는 표시 데이터와 이벤트만 둔다.

필수 표시 props:

- `caseNumber`
- `reportStatusLabel`
- `progressPercent`
- `documents`
- `evidenceFiles`
- `isLoading`
- `errorMessage`
- `copyFeedbackVisible`
- `sharingEvidenceId`

필수 이벤트 props:

- `onBack`
- `onRetry`
- `onCopyCaseNumber`
- `onOpenCaseGuide`
- `onOpenDocument(documentId)`
- `onOpenEvidence(evidenceId)`
- `onShareEvidence(evidenceId)`
- `onCaseTab`
- `onGuideTab`
- `onDocumentsTab`

View props에 `router`, Context 객체, service 객체 또는 기기 API를 전달하지 않는다.

### 4.3 1단계 완료 기준

- S07에 필요한 모든 정상·로딩·오류·빈 상태를 props만으로 표현할 수 있다.
- View가 문서 종류를 추측하지 않고 전달받은 값을 표시할 수 있다.
- 공유 가능한 파일과 공유 불가능한 파일을 구분할 수 있다.

---

## 5. 2단계 — 서류 조회 service 경계와 fixture 준비

backend 계약이 아직 없으므로 실제 네트워크 호출처럼 교체 가능한 service interface를 만들고 mock 구현을 연결한다.

### 5.1 service 계약

`documents.ts`는 다음 책임만 가진다.

```ts
type DocumentsService = {
  getOverview(caseId: string): Promise<DocumentsOverview>;
};
```

- View나 Screen에서 fixture를 직접 import하지 않는다.
- service 오류는 사용자 문구와 기술 오류를 구분할 수 있는 오류 타입으로 정규화한다.
- 화면 unmount 후 완료된 요청이 state를 변경하지 않도록 Screen에서 request id 또는 취소 상태를 관리한다.

### 5.2 mock 데이터

`mockDocuments.ts`는 와이어프레임을 재현할 수 있는 개발용 응답을 제공한다.

- 사건번호는 현재 draft의 실제 값을 우선 사용한다.
- 상태 문구: `신고 완료`
- 진행률: `80`
- 작성 문서:
  - `사건 카드 (최종)`
  - `경찰서 신고서 초안`
- 증빙:
  - `업로드한 신고서 사진`

와이어프레임에 보이는 날짜·이메일 전송 문구는 개발 fixture임을 코드에서 명확히 분리한다. 실제 업로드 기록이 없는데 production 데이터처럼 영구 저장하지 않는다.

### 5.3 2단계 완료 기준

- mock service를 실제 service로 교체해도 View props가 바뀌지 않는다.
- 성공, 빈 목록, 오류 응답을 각각 재현할 수 있다.
- 유효한 `caseId`가 없으면 조회하지 않고 Screen에서 활성 사건 없음 상태를 만든다.

---

## 6. 3단계 — 사건번호 formatter 공통화

S06과 S07의 사건번호 표기가 달라지지 않도록 기존 `CaseAccessScreen.tsx` 내부의 `formatCaseNumber()`를 공통 utility로 옮긴다.

목표:

```text
CaseAccessScreen ─┐
                  ├─ formatCaseNumber()
DocumentsScreen ──┘
```

규칙:

- 내부 원본 사건번호는 변경하지 않는다.
- 화면에 보여줄 때만 formatter를 사용한다.
- 정규식과 맞지 않는 값은 삭제하거나 임의 변형하지 않고 원문을 반환한다.
- 복사되는 값은 S06과 S07에서 동일한 표시 형식을 사용한다.

### 6.1 3단계 완료 기준

- 같은 사건번호가 S06과 S07에서 완전히 같은 형식으로 보인다.
- formatter가 Screen 외부에서 재사용 가능하다.

---

## 7. 4단계 — route와 Screen 뼈대 생성

### 7.1 Expo Router route

`app/case/documents/index.tsx`를 만든다.

```tsx
import { DocumentsScreen } from "@/features/documents/screens/DocumentsScreen";

export default function DocumentsRoute() {
  return <DocumentsScreen />;
}
```

route 파일에는 데이터 조회나 UI 로직을 넣지 않는다.

### 7.2 `DocumentsScreen`

Screen은 다음 순서로 동작한다.

1. `useCaseDraft()`에서 `caseId`, `caseNumber`를 읽는다.
2. 활성 사건이 없으면 service 호출을 생략하고 오류·빈 상태를 View에 전달한다.
3. 활성 사건이 있으면 loading 상태로 `getOverview(caseId)`를 호출한다.
4. 응답 진행률을 `0~100`으로 제한한다.
5. 사건번호를 공통 formatter로 표시용 변환한다.
6. 날짜를 한국어 사용자 문구로 변환한다.
7. View 이벤트를 Router·Clipboard·Share 동작에 연결한다.
8. unmount 또는 재시도 시 오래된 요청 응답을 무시한다.

### 7.3 4단계 완료 기준

- `/case/documents`가 독립 route로 열린다.
- route는 얇게 유지되고 상태·이벤트는 Screen에 있다.
- View는 기기 API와 Router를 import하지 않는다.

---

## 8. 5단계 — View 전체 레이아웃 구성

처음에는 세부 색상보다 정보 순서와 영역 높이를 먼저 맞춘다.

```text
Safe Area
├─ 헤더: 뒤로가기 + 서류
├─ ScrollView
│  ├─ 사건 요약 카드
│  ├─ 작성된 서류
│  │  ├─ 사건 카드 (최종)
│  │  └─ 경찰서 신고서 초안
│  ├─ 증빙 자료
│  │  └─ 업로드한 신고서 사진
│  └─ 기획 확인 안내
└─ 하단 내비게이션: 사건 / 가이드 / 서류
```

레이아웃 규칙:

- 화면 배경은 와이어프레임과 가까운 아주 연한 회색·청색 계열로 사용한다.
- 기본 좌우 여백은 `16`이다.
- 카드 간 세로 간격은 `12~16`을 기준으로 한다.
- 본문만 스크롤하고 하단 내비게이션은 safe area 위에 고정한다.
- 마지막 안내 영역이 하단 내비게이션에 가려지지 않도록 ScrollView 하단 padding을 확보한다.
- 작은 기기에서 카드의 텍스트가 버튼을 밀어내지 않도록 텍스트 영역에 `flex: 1`과 우측 버튼 고정 폭을 사용한다.

`AppScreen`의 footer를 재사용할 수 있는지 먼저 확인한다. 와이어프레임의 배경과 하단 탭 구조를 만들기 어렵다면 S07에서만 안전하게 확장하되 기존 화면의 footer 모양은 바꾸지 않는다.

---

## 9. 6단계 — S07 전용 헤더 구현

S07 헤더는 S02~S06의 중앙 정렬 `FlowHeader`와 구조가 다르다.

```text
[←] [서류]                                      [빈 영역]
```

- 뒤로가기 화살표와 `서류`를 왼쪽 묶음으로 배치한다.
- 우측에 `3/6` 같은 단계 숫자나 액션을 표시하지 않는다.
- 전체 터치 영역은 최소 `44×44`를 확보한다.
- 화면명은 굵은 짙은 글씨로 표시한다.
- S07 하나 때문에 기존 `FlowHeader`를 억지로 변경해 S02~S06 정렬을 깨뜨리지 않는다.
- 재사용 필요성이 확인되면 별도 `SectionHeader` 또는 variant를 추가한다.

---

## 10. 7단계 — 사건 요약 카드 구현

카드 내부 순서는 다음과 같다.

1. `사건 번호` label
2. 사건번호와 복사 아이콘
3. 우측 상단 `신고 완료` badge
4. `해당 사건 가이드 확인하기 ›` 링크
5. `신고 처리 진행률` label과 우측 `80%`
6. 파란 ProgressBar

구현 규칙:

- 사건번호는 가장 굵은 정보로 표시한다.
- 사건번호 전체와 복사 아이콘 중 최소 아이콘은 Pressable로 만든다.
- 복사 성공 후 약 2초 동안 `복사됨` 접근성 label 또는 짧은 피드백을 제공한다.
- copy timer는 unmount 시 정리한다.
- badge는 CTA가 아니므로 Pressable로 만들지 않는다.
- 진행률 숫자는 `Math.round(progressPercent)`를 사용한다.
- 공통 `ProgressBar`에는 `progressPercent / 100`을 전달한다.
- 숫자와 bar가 서로 다른 값을 표시하지 않게 하나의 정규화된 값에서 계산한다.

### 10.1 사건 가이드 링크

S11 route가 없으므로 링크 이벤트는 View에서 `onOpenCaseGuide`만 호출한다. Screen에서는 현재 `준비 중` 안내를 표시한다. S11 구현 후 Screen handler만 실제 route 이동으로 교체한다.

---

## 11. 8단계 — 작성된 서류 카드 구현

두 문서 카드는 동일한 카드 component 또는 동일한 렌더링 규칙을 사용한다.

공통 구조:

```text
[아이콘 영역] [제목                         ] [보기]
              [설명                         ]
```

### 11.1 사건 카드

- 제목: `사건 카드 (최종)`
- 설명: `입력하신 상황을 바탕으로 구조화된 정보`
- 아이콘: 문서 형태
- 버튼: `보기`

### 11.2 경찰서 신고서 초안

- 제목: `경찰서 신고서 초안`
- 설명: `일본 경찰서 제출용 일본어 번역 포함`
- 아이콘: 번역·문서 형태
- 버튼: `보기`

상태 규칙:

- `READY`: `보기` 활성화
- `GENERATING`: 버튼 대신 `준비 중` 또는 loading 표시
- `FAILED`: 오류 표시와 재생성 정책이 없으면 비활성화
- 문서 배열이 비어 있으면 `아직 작성된 서류가 없습니다.` 빈 상태 표시

S08·S09 route가 아직 없으므로 `보기`는 Screen callback을 호출하고 현재는 문서 종류에 맞는 `준비 중` 안내를 표시한다. 존재하지 않는 route 문자열을 미리 넣지 않는다.

---

## 12. 9단계 — 증빙 자료 카드와 공유 처리

증빙 카드 구조:

```text
[카메라 아이콘] [업로드한 신고서 사진          ] [공유]
                 [저장 위치 설명                 ]
                 [등록·전송 정보                 ]
```

표시 규칙:

- 제목은 굵게 표시한다.
- 저장 위치 설명은 secondary 색상으로 표시한다.
- 등록·전송 정보는 primary blue로 강조하되 링크가 아니면 Pressable로 만들지 않는다.
- 날짜는 fixture에 고정된 한국어 문자열을 넣지 않고 ISO 값을 formatter로 변환한다.
- 이메일 주소나 사용자 개인정보를 fixture·로그에 넣지 않는다.

공유 규칙:

1. `localUri` 존재 여부를 확인한다.
2. 유효한 파일이 있으면 Screen에서 React Native `Share` 또는 확정된 Expo 공유 API를 호출한다.
3. 공유 중에는 해당 evidence의 `공유` 버튼만 loading·비활성화한다.
4. 공유 취소는 오류로 표시하지 않는다.
5. URI 없음, 파일 접근 실패, 공유 실패는 카드 가까이에 안내한다.
6. 원본 보관·공유 정책 확정 전에는 파일을 새 위치로 복제하거나 영구 저장하지 않는다.

S15·S16이 구현되기 전 mock 증빙에는 실제 파일 URI가 없을 수 있다. 이 경우 UI는 재현하되 공유를 가장한 가짜 성공 메시지를 표시하지 않고 `공유할 파일이 아직 준비되지 않았습니다.`라고 안내한다.

---

## 13. 10단계 — 하단 내비게이션 구현

와이어프레임과 같은 3열 구조를 사용한다.

```text
[사건]             [가이드]             [서류 활성]
```

- 각 항목은 아이콘과 label을 세로로 배치한다.
- `서류`는 파란색 둥근 채움 영역, 흰색 아이콘·글씨로 활성화한다.
- `사건`, `가이드`는 흰색 배경과 회색 아이콘·글씨를 사용한다.
- 각 항목의 터치 영역은 최소 `44×44`다.
- `서류`를 다시 누르면 S07을 중복 push하지 않는다.
- 같은 탭을 다시 눌렀을 때 스크롤을 최상단으로 올릴지는 후속 화면과 함께 통일하기 전까지 아무 동작도 하지 않아도 된다.

연결 정책:

- `사건`: 대상 사건 화면이 확정되기 전까지 `준비 중` 안내
- `가이드`: S11 route 생성 전까지 `준비 중` 안내
- `서류`: 현재 화면 유지

전역 탭 Router 구조로 성급하게 개편하지 않는다. S07에서 모양과 props 계약을 먼저 검증한 뒤 S08·S11이 확정되면 공통 navigation으로 승격한다.

---

## 14. 11단계 — 아이콘 적용

현재 `apps/mobile/package.json`에는 아이콘 package가 직접 dependency로 선언되어 있지 않다.

구현 전에 다음 순서로 판단한다.

1. 프로젝트에서 이미 직접 import 가능한 아이콘 package가 있는지 확인한다.
2. 없다면 Expo SDK 54 호환 방식으로 `@expo/vector-icons` 설치를 검토한다.
3. dependency를 추가한다면 Expo가 호환 버전을 선택하도록 프로젝트 루트에서 실행한다.

```cmd
pnpm.cmd --filter mobile exec expo install @expo/vector-icons
```

아이콘은 의미에 맞게 통일한다.

- 뒤로가기: arrow back
- 사건번호 복사: copy
- 사건 카드: document
- 신고서 초안: translate 또는 document text
- 증빙: camera
- 사건 탭: warning 또는 case
- 가이드 탭: book
- 서류 탭: document
- 안내: information

이모지나 플랫폼마다 모양이 달라지는 문자 glyph로 최종 UI를 만들지 않는다. 새 dependency 설치가 필요하면 실제 구현 단계에서만 실행한다.

---

## 15. 12단계 — S07 진입점 연결

S07 화면을 만든 뒤 접근 가능한 정상 경로를 연결한다.

### 15.1 S01 서류 버튼

`HomeScreen`의 `handleDocumentsTab()`을 다음 정책으로 바꾼다.

- `draft.caseId`와 `draft.caseNumber`가 있으면 `/case/documents`로 이동
- 활성 사건이 없으면 기존 `활성 사건 없음` 안내 유지

이를 위해 `HomeScreen`은 `resetDraft`뿐 아니라 현재 `draft`도 읽는다.

### 15.2 S06 이후 이동

S06의 CTA는 `저장하고 가이드 시작하기`이므로 S07로 임의 연결하지 않는다. S11이 구현되기 전의 기존 완료 상태를 유지한다. S07 접근을 위해 CTA 의미를 바꾸지 않는다.

### 15.3 직접 접근 방어

사용자가 deep link로 `/case/documents`에 진입했지만 활성 사건이 없으면 앱이 crash하지 않아야 한다.

- 활성 사건 없음 안내
- 홈으로 돌아가기 동작
- service 호출 생략

### 15.4 12단계 완료 기준

- 저장된 활성 사건이 있는 사용자는 S01의 서류 버튼으로 S07에 진입할 수 있다.
- 활성 사건이 없으면 기존 안내가 유지된다.
- S06의 가이드 CTA 의미가 변경되지 않는다.

---

## 16. 13단계 — 상태별 UI 완성

### 16.1 조회 중

- 헤더와 하단 navigation은 유지한다.
- 본문 카드 위치에 skeleton 또는 작은 loading 상태를 표시한다.
- 전체 화면을 빈 spinner 하나로 대체하지 않는다.

### 16.2 정상

- 사건 요약 → 작성된 서류 → 증빙 자료 → 안내 순서를 유지한다.
- API 배열 순서가 달라도 문서 kind 기준으로 기획 순서를 정규화할지 service에서 결정한다.

### 16.3 문서 생성 중

- 해당 카드만 `준비 중`으로 표시한다.
- 다른 문서와 증빙 동작은 유지한다.

### 16.4 작성 문서 또는 증빙 없음

- 섹션 제목은 유지한다.
- `아직 작성된 서류가 없습니다.` 또는 `아직 등록된 증빙 자료가 없습니다.`를 표시한다.
- 와이어프레임 예시 데이터를 빈 상태에 대신 표시하지 않는다.

### 16.5 조회 실패

- 헤더와 하단 navigation은 유지한다.
- 본문 상단에 오류 메시지와 `다시 불러오기`를 표시한다.
- 재시도 중 중복 요청을 막는다.

### 16.6 복사·공유 오류

- 전체 조회 오류로 바꾸지 않는다.
- 실행한 카드 가까이에만 오류를 표시한다.
- 정상적으로 조회한 다른 콘텐츠는 유지한다.

---

## 17. 14단계 — 디자인 상세 조정

기능 상태가 연결된 후 와이어프레임과 시각적으로 맞춘다.

### 17.1 색상

- 화면 배경: `colors.surface` 또는 그보다 옅은 배경 토큰
- 카드: `colors.background`
- 주요 텍스트: `colors.text`
- 설명: `colors.textSecondary`
- 링크·진행률·아이콘: `colors.primary`
- badge·아이콘 배경·pill 버튼: `colors.primarySoft`
- border: 기존 `colors.border`를 낮은 대비로 사용

필요한 색이 현재 토큰에 없으면 S07 View에 임의 hex를 반복하지 않고 의미 기반 토큰 추가를 검토한다. 전역 토큰 변경으로 기존 화면의 색이 달라지지 않게 한다.

### 17.2 크기와 간격

- 헤더 높이: 최소 `52`
- 본문 좌우 여백: `16`
- 사건 요약 카드 radius: 약 `16`
- 문서·증빙 카드 radius: 약 `16`
- 아이콘 배경: 약 `44×44`
- `보기`·`공유` pill: 시각 크기와 별개로 터치 높이 최소 `44`
- 하단 navigation: safe area를 제외하고 약 `58~64`

### 17.3 긴 문자열

- 사건번호는 필요한 경우 글자 크기를 줄이기보다 줄바꿈 정책을 먼저 결정한다.
- 문서 설명은 2~3줄까지 허용한다.
- 증빙 설명과 날짜는 자연스럽게 줄바꿈한다.
- 우측 pill 버튼은 줄어들지 않도록 `flexShrink: 0`을 적용한다.

---

## 18. 15단계 — 접근성과 웹 대응

### 18.1 접근성

- 뒤로가기, 복사, 보기, 공유, 하단 탭에 명확한 `accessibilityLabel`을 지정한다.
- loading 버튼은 `accessibilityState.busy`를 제공한다.
- 비활성 문서는 `accessibilityState.disabled`를 제공한다.
- 현재 `서류` 탭은 selected 상태를 전달한다.
- 진행률은 공통 `ProgressBar`의 `0~100` 접근성 값을 유지한다.
- 상태 변화 `복사됨`, 공유 실패가 스크린리더에도 전달되게 한다.

### 18.2 웹

`DocumentsView.web.tsx`를 같은 단계에서 구현한다면 `DocumentsView.types.ts`를 그대로 사용한다.

- 콘텐츠 최대 너비 약 `480px`, 화면 중앙 정렬
- 모바일과 같은 세로 정보 순서
- 카드와 CTA를 데스크톱 다단 구조로 재설계하지 않음
- hover뿐 아니라 keyboard focus 표시 제공
- Clipboard·Share는 Screen의 플랫폼 분기에서 처리하고 View 계약은 유지

---

## 19. 16단계 — 정적 검사

구현 후 프로젝트 루트에서 실행한다.

```cmd
pnpm.cmd --filter mobile typecheck
git diff --check
```

추가 확인:

```cmd
rg -n "3/6|4/6|5/6|6/6" apps\mobile\src apps\mobile\app
rg -n "router\.push|router\.replace" apps\mobile\src\features\documents
```

검사 목적:

- S07 우측 상단 단계 숫자가 다시 들어가지 않았는지 확인
- 존재하지 않는 S08·S09·S11 route를 미리 호출하지 않는지 확인
- View가 Router를 직접 import하지 않는지 확인
- TypeScript props와 service 응답이 일치하는지 확인

정적 검사에서 기존 사용자 변경과 관계없는 파일을 자동 수정하지 않는다.

---

## 20. 17단계 — 실기기 QA

정적 검사 후 Expo Go 또는 development build에서 확인한다.

### 20.1 정상 흐름

1. 활성 사건을 생성한다.
2. S01의 `서류` 버튼으로 S07에 진입한다.
3. 사건번호가 S06과 같은 형식인지 확인한다.
4. 복사 후 실제 clipboard 값을 확인한다.
5. 진행률 숫자와 bar의 비율이 같은지 확인한다.
6. 작성 문서 두 개와 증빙 카드 순서를 확인한다.
7. `보기`, 가이드, 사건 탭이 crash 없이 준비 중 안내를 표시하는지 확인한다.
8. 공유할 URI가 없을 때 가짜 성공이 아닌 준비되지 않음 안내를 확인한다.
9. 뒤로가기가 직전 화면으로 이동하는지 확인한다.

### 20.2 상태 QA

- loading
- 조회 실패 후 재시도
- 문서 생성 중
- 작성 문서 없음
- 증빙 자료 없음
- 공유 중과 공유 실패
- 활성 사건 없이 deep link 진입

### 20.3 레이아웃 QA

- 작은 Android 화면
- 글자 크기 확대
- 긴 사건번호와 긴 설명
- 하단 safe area가 큰 iPhone
- 스크롤 마지막 안내가 하단 navigation에 가려지지 않는지 확인
- 화면 회전 또는 폭 변경 후 카드가 깨지지 않는지 확인

---

## 21. 최종 완료 기준

다음 조건을 모두 만족해야 S07 구현이 완료된 것으로 본다.

### 화면

- 우측 상단 단계 숫자가 없다.
- 헤더에 뒤로가기와 `서류`가 왼쪽 정렬로 표시된다.
- 사건 요약 카드의 정보 순서가 와이어프레임과 같다.
- `신고 완료` badge, `80%` 숫자와 ProgressBar가 일치한다.
- 작성 문서 두 개와 증빙 카드가 와이어프레임 순서대로 표시된다.
- 하단 `사건 / 가이드 / 서류`에서 서류가 활성 상태다.

### 기능

- 사건번호 복사가 동작하고 timer가 정리된다.
- 활성 사건이 없을 때 안전한 fallback이 있다.
- 조회·빈 값·오류·생성 중 상태가 구분된다.
- 공유할 실제 파일이 없을 때 성공으로 위장하지 않는다.
- 존재하지 않는 후속 route로 이동하지 않는다.
- S01 서류 진입점이 활성 사건 유무에 따라 올바르게 동작한다.

### 구조

- Route → Screen → View 책임이 분리되어 있다.
- 서류 조회 데이터가 `CaseDraft`에 무분별하게 섞이지 않는다.
- 앱과 웹이 공유할 `DocumentsView.types.ts` 계약이 존재한다.
- 사건번호 formatter가 S06과 S07에서 공유된다.
- 타입 검사와 `git diff --check`가 통과한다.

---

## 22. 실제 작업 시작 순서 요약

구현을 시작할 때는 아래 순서를 그대로 따른다.

1. S07 데이터 타입 정의
2. `DocumentsView.types.ts` 계약 작성
3. documents service interface와 mock 응답 작성
4. 사건번호 formatter 공통화
5. `/case/documents` route 생성
6. `DocumentsScreen` 조회·이벤트 상태 연결
7. `DocumentsView` 전체 레이아웃 작성
8. 헤더 구현
9. 사건 요약 카드와 진행률 구현
10. 작성 문서 카드 구현
11. 증빙 카드와 공유 상태 구현
12. 하단 navigation 구현
13. 아이콘 dependency 필요 여부 확인 및 적용
14. S01의 활성 사건 서류 진입점 연결
15. loading·빈 값·오류 상태 완성
16. 접근성·웹 반응형 보완
17. 정적 검사
18. 실기기 QA

첫 구현 목표는 후속 화면을 가짜로 만드는 것이 아니라, **S07 자체를 와이어프레임과 같은 서류 허브로 완성하고 이후 S08·S09·S11을 안전하게 연결할 경계를 마련하는 것**이다.
