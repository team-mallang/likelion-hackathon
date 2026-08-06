# 모바일 프론트엔드 S01~S05 구현 가이드

이 문서는 현재 저장소 상태에서 `docs/USER_FLOW.md`의 S01~S05 화면을 실제로 구현하기 위한 작업 순서를 정리한다. 전체 서비스 범위는 루트 `README.md`, 이번 모바일 구조는 `apps/mobile/STRUCTURE.md`, 화면 요소와 이동 조건은 `docs/USER_FLOW.md`를 기준으로 한다.

## 0. 이번 목표

이번 작업에서는 다음 다섯 화면만 완성한다.

```text
S01 홈
 → S02 음성 입력
 → S03 녹음내용 확인
 → S04 추가 질문
 → S05 사건카드 내용 확정
```

완료 기준은 화면 5장을 따로 그리는 것이 아니라, 가짜 분실 사건 데이터로 S01부터 S05까지 이동하고 수정한 값이 유지되는 세로 흐름을 시연하는 것이다.

- S06~S20 화면 구현은 이번 범위가 아니다.
- S19가 아직 상세 정의되지 않았으므로 S01의 `이전 사건 조회`는 준비 중 안내로 처리한다.
- S05 확정 후 S06 이동은 후속 작업이다. 이번에는 저장 성공 상태와 다음 단계 안내까지만 구현한다.
- 실제 API와 마이크·위치는 UI 흐름이 안정된 뒤 adapter를 교체하는 방식으로 연결한다.

## 1. 현재 저장소에서 이미 된 것

| 항목 | 현재 상태 |
|---|---|
| 모노레포·pnpm | workspace와 `pnpm-lock.yaml` 존재 |
| Expo 앱 | Expo SDK 54, React Native, Expo Router, TypeScript strict 설정 완료 |
| 라우팅 기반 | `app/_layout.tsx`, `app/index.tsx` 존재 |
| 라우트 폴더 | `case/new`, `review`, `questions`, `confirmation` 폴더 생성됨 |
| 디자인 토큰 | 색상·간격·radius 최소 토큰 존재 |
| 공통 컴포넌트 | `Button`, `AppTextInput`, `LoadingState`, `ErrorState` 존재 |
| 환경 변수 | `.env.example`에 `EXPO_PUBLIC_API_BASE_URL` 존재 |
| 공유 계약 | 사건 생성·수정·확정·인증, AI 질문 결과 Zod 스키마 일부 존재 |
| 웹 API | 사건 생성, 조회·수정, 분석, 확정, 인증 route 구현됨 |
| 모바일 typecheck | 현재 기준 통과 |

## 2. 아직 안 된 것과 우선순위

### 바로 구현할 것

1. 공통 모바일 화면 레이아웃과 flow header
2. S01~S05 실제 route 파일과 screen 컴포넌트
3. S02~S05 입력을 유지하는 사건 초안 provider
4. 와이어프레임용 mock fixture와 mock service
5. 화면별 정상·입력 오류·처리 중·실패 상태
6. Android 또는 iOS 기기에서 전체 이동 검증

### UI 흐름 다음에 구현할 것

1. 마이크 권한과 실제 녹음
2. 음성 파일의 텍스트 변환 방식
3. 위치 권한과 현재 위치·현지 시간
4. 실제 모바일 API client
5. 공유 Zod 응답 스키마 보완

### 이번에 하지 않을 것

- S06~S20 화면
- 하단 사건·서류·가이드 탭의 실제 라우팅
- 지도, 카메라, Agora, 보험, 신고서 업로드
- 대규모 UI 라이브러리나 전역 상태 라이브러리 도입
- 계약이 없는 API 필드를 화면 코드에서 임의 확정

## 3. 작업 시작과 실행 확인

### 3.1 작업 트리 확인

```cmd
git branch --show-current
git status --short
```

팀원의 미커밋 변경을 임의로 되돌리지 않는다. 기능 작업은 팀 브랜치 규칙에 맞는 별도 브랜치에서 진행한다.

### 3.2 설치와 typecheck

프로젝트 루트에서 실행한다.

```cmd
pnpm install
pnpm --filter mobile typecheck
```

이 문서의 명령어는 Windows 명령 프롬프트(`cmd.exe`)에서 실행하는 것을 기준으로 한다. 이미 잠금 파일이 있으므로 새 설치 결과가 `pnpm-lock.yaml`을 불필요하게 크게 바꾸지 않는지 확인한다.

### 3.3 앱 실행

```cmd
pnpm --filter mobile dev
```

필요한 플랫폼을 직접 지정할 수도 있다.

```cmd
pnpm --filter mobile android
pnpm --filter mobile ios
pnpm --filter mobile web
```

브라우저는 빠른 레이아웃 확인에만 사용한다. 마이크·위치·키보드·safe area·기기 뒤로가기는 Android 또는 iOS에서 다시 확인한다.

현재 홈에 임시 `Travel Guard` 문구가 보이면 실행 기반은 정상이다. 이 임시 화면을 S01 와이어프레임으로 교체하는 것이 실제 화면 구현의 시작점이다.

## 4. 코딩 전에 고정할 구조

`apps/mobile/STRUCTURE.md`에 정의된 다음 경계를 따른다.

```text
app route wrapper
  → feature screen
    → CaseDraftProvider
      → caseFlow interface
        ├── mockCaseFlow
        └── apiCaseFlow (계약 정리 후)
```

- `app/**/index.tsx`에는 큰 JSX와 상태 로직을 넣지 않는다.
- S02~S05의 입력 상태는 화면별 `useState`로 흩어놓지 않는다.
- 지금 규모에서는 React Context와 reducer로 충분하다. 새 상태 라이브러리는 필요가 생긴 뒤 검토한다.
- mock과 실제 API가 같은 screen props와 action을 사용하게 한다.
- 서버 DTO와 화면 표시용 draft를 분리한다.

## 5. 구현 순서

### 1단계. 공통 레이아웃 완성

먼저 다음 컴포넌트를 만든다.

| 컴포넌트 | 역할 |
|---|---|
| `AppScreen` | SafeArea, 배경, 스크롤, 공통 좌우 여백, 하단 버튼 영역 |
| `FlowHeader` | 뒤로가기, 중앙 제목, 우측 단계 표시 |
| `ProgressBar` | S03·S04 진행 상태 |

함께 할 일:

- `app/_layout.tsx`의 기본 Expo header를 숨기고 각 와이어프레임 header를 사용한다.
- `tokens.ts`에 와이어프레임에서 반복되는 typography, surface 색상, pill radius를 필요한 만큼만 추가한다.
- 기존 `Button`에 화면에서 필요한 secondary·outline 형태가 필요하면 `variant`를 추가한다.
- 버튼과 입력은 최소 44px 이상의 터치 영역과 접근성 label을 가진다.

완료 확인:

- 긴 화면이 작은 기기에서 스크롤된다.
- 하단 주요 버튼이 키보드에 가려지지 않는다.
- Android와 iOS safe area가 깨지지 않는다.

### 2단계. route와 사건 초안 상태 연결

생성할 route:

```text
app/index.tsx                    # S01
app/case/_layout.tsx             # CaseDraftProvider
app/case/new/index.tsx           # S02
app/case/review/index.tsx        # S03
app/case/questions/index.tsx     # S04
app/case/confirmation/index.tsx  # S05
```

`CaseDraftProvider`는 적어도 다음 action을 제공한다.

- 새 사건 초안 초기화
- 사건 설명 변경
- 위치·시간 변경
- 분석 결과와 질문 목록 저장
- 현재 질문 답변 저장
- 사건 유형·물품·상세 단서 수정
- 저장 중·오류·성공 상태 갱신

뒤로 이동해도 입력을 유지하고, S01에서 새 사건을 다시 시작할 때만 명시적으로 초기화한다.

### 3단계. mock fixture로 S01~S05 구현

실제 개인정보가 아닌 와이어프레임용 가짜 시나리오 하나를 만든다.

```text
장소: 일본 도쿄 신주쿠역 주변
사건 설명: 가방에서 지갑을 잃어버린 상황
물품: 가짜 여권 항목, 신용카드
특징: 검은색 가죽 지갑, 내부 가족 사진
추가 질문: 마지막 확인 장소, 보관 위치, 특징, 비정상 결제 여부
```

`mockCaseFlow`에는 짧은 지연과 성공·실패 전환 옵션을 둔다. 그래야 로딩과 재시도 화면을 실제 API 없이 검증할 수 있다.

#### S01 홈

- 와이어프레임의 로고, 안내 문구, 사건 시작, 이전 사건 조회, 긴급 신고, 하단 영역 구현
- 사건 시작 시 draft를 초기화하고 `/case/new`로 이동
- 이전 사건 조회는 S19 정의 전까지 `준비 중` 안내
- 실제 하단 탭 이동은 후속 범위로 두되 비활성 또는 준비 중 상태를 명확히 표시

#### S02 음성 입력

첫 PR에서는 실제 마이크보다 화면 상태를 먼저 구현한다.

- `대기 → 녹음 중 → 중지` 상태와 타이머 표시
- mock 인식 문장 표시
- 인식 내용이 있을 때 S03 이동
- 내용이 없으면 같은 화면에서 입력 안내
- 텍스트 직접 입력 모드 제공
- mock 현재 위치·현지 시간 표시
- 권한 거부와 녹음 오류 UI를 상태 전환으로 시연 가능하게 구성

#### S03 녹음내용 확인

- S02 인식 문장 표시와 직접 수정
- 위치·발생 시간 수정
- 다시 녹음 시 S02로 이동하되 정책에 따라 기존 값을 초기화
- 분석 버튼 중복 탭 방지
- mock 분석 성공 시 질문 목록을 저장하고 S04 이동
- 분석 실패 시 입력을 보존하고 재시도 제공

#### S04 추가 질문

- 질문을 한꺼번에 렌더링하지 않고 현재 질문 하나만 표시
- 답변 완료 후 다음 질문으로 이동
- 뒤로 이동하거나 이전 질문을 다시 봐도 답변 보존
- 필수 답변이 없으면 다음 진행 차단
- 마지막 질문 완료 시 mock 사건카드 결과를 만들고 S05 이동

#### S05 사건카드 내용 확정

- 사건 유형, 분실 물품, 발생 시간·장소, 긴급 물품, 위험도, 상세 특징·추가 단서 표시
- 사건 유형·물품·시간·장소·상세 정보 수정
- 수정값을 draft에 반영
- 저장 중 중복 탭 방지, 필수값 오류, 저장 실패와 재시도 제공
- 저장 성공 후 `사건 초안이 저장되었습니다. 다음 단계는 사건번호와 비밀번호 설정입니다.` 안내
- S06 route가 구현되기 전에는 존재하지 않는 경로로 이동시키지 않음

### 4단계. 기기 기능 연결

S01~S05 mock 흐름이 완성된 후 S02부터 실제 기기 기능을 붙인다.

#### 마이크

현재 Expo SDK 54에서는 공식 `expo-audio` 녹음 API를 우선 검토한다. 설치와 설정은 [Expo SDK 54 Audio 문서](https://docs.expo.dev/versions/v54.0.0/sdk/audio/)를 기준으로 한다.

```cmd
pnpm --filter mobile exec expo install expo-audio
```

- 녹음 버튼을 누를 때 권한 이유를 설명한 뒤 요청
- 거부 시 텍스트 직접 입력 제공
- 녹음 중 앱 background, 전화 수신, 장치 연결 해제 처리
- 원본 음성을 언제 업로드·삭제하는지 정책 확정 전 영구 저장하지 않음
- 음성 녹음과 음성→텍스트 변환은 별개이므로 변환 endpoint 계약을 따로 확정

#### 위치

위치 패키지와 권한 문구는 구현 시점의 [Expo Location 문서](https://docs.expo.dev/versions/latest/sdk/location/)를 확인한다.

- S02 진입 즉시 강제 요청하지 않고 위치가 필요한 시점에 요청
- 거부 시 S03에서 장소 직접 입력
- 화면 표시 문자열과 API 전송용 구조화 위치를 분리
- 현지 시간의 timezone 기준을 API 담당자와 합의

## 6. 실제 API 연결 전에 해결할 계약

현재 API 파일은 존재하지만 S01~S05 흐름을 그대로 연결할 수는 없다.

### 6.1 draft 인증

현재 동작:

```text
POST /api/cases                  # 사건 생성, access token 없음
POST /api/cases/[id]/analyze     # Bearer access token 필요
PATCH /api/cases/[id]            # Bearer access token 필요
```

생성 직후 분석·수정할 방법이 없으므로 아래 중 하나를 백엔드와 확정해야 한다.

- 사건 생성 응답에 짧은 수명의 draft access token 반환
- 확정 전 전용 draft session 도입

모바일이 인증을 우회하거나 임시 비밀값을 코드에 넣으면 안 된다.

### 6.2 S04 답변 저장

현재 `caseAnalysisQuestionSchema`는 `field`, `question`만 정의한다. 다음 항목을 합의해야 한다.

- 답변 타입: text, single choice, boolean 등
- 선택지 구조
- 필수 여부
- 답변 저장 endpoint와 요청 스키마
- 질문 순서와 재분석 여부

### 6.3 S05 수정 저장

현재 `updateCaseSchema`만으로는 S05의 물품 목록, 긴급 물품 여부, 위험도, 상세 단서 전체를 저장할 수 없다. DB 모델과 API 요청을 확인해 공유 Zod 계약을 확장한다.

### 6.4 API 문서와 응답 검증

`docs/API.md`는 아직 health check만 기록하고 있으므로 실제 route와 일치하게 갱신해야 한다. 모바일 API client를 만들 때 성공 응답과 오류 응답도 Zod로 검증할 수 있도록 공유 응답 스키마를 추가한다.

계약 해결 후 연결 순서:

```text
/api/health
 → 사건 draft 생성
 → 분석
 → 질문 답변 저장
 → 사건카드 수정 저장
 → S06 구현 후 최종 confirm
```

## 7. API client 규칙

- base URL은 `EXPO_PUBLIC_API_BASE_URL`만 사용한다.
- 실기기에서 `localhost`는 개발 PC가 아니다. 같은 네트워크의 PC LAN IP 또는 개발 서버 주소를 사용한다.
- JSON 파싱 오류, 네트워크 오류, HTTP 오류, Zod 검증 오류를 구분한다.
- 서버 stack trace나 내부 메시지를 화면에 그대로 노출하지 않는다.
- 요청 중 주요 버튼을 비활성화해 중복 제출을 막는다.
- 사건 설명·위치·물품·연락처를 개발 로그에 출력하지 않는다.
- mock과 실제 adapter는 같은 `caseFlow` interface를 구현한다.

## 8. PR을 나누는 권장 방식

### PR 1: 공통 기반과 S01~S02

- 공통 layout·header·progress
- CaseDraftProvider와 mock fixture
- S01 홈
- S02 음성 입력의 mock 상태와 텍스트 대체 입력
- S01 → S02 이동

### PR 2: S03~S04

- 녹음 내용·위치·시간 편집
- mock 분석 상태
- 질문 1개씩 표시와 답변 보존
- S02 → S03 → S04 이동

### PR 3: S05와 전체 흐름 QA

- 사건카드 표시와 편집
- mock 저장 상태
- S01 → S05 전체 이동
- 뒤로가기·키보드·작은 화면·오류 상태 검증

### PR 4: 기기와 실제 API

- 마이크·위치 권한과 대체 흐름
- 합의된 공유 스키마
- API client와 실제 adapter
- mock/실제 환경 전환

PR 4는 API 계약 문제가 해결된 뒤 시작한다.

## 9. 화면 5개 완료 체크리스트

### 실행과 구조

- [ ] 새 팀원이 루트에서 모바일 앱을 실행할 수 있음
- [ ] route wrapper와 feature screen 책임이 분리됨
- [ ] S02~S05 draft가 한 곳에서 관리됨
- [ ] `pnpm --filter mobile typecheck` 통과
- [ ] `git diff --check` 통과

### 사용자 흐름

- [ ] S01에서 새 사건을 시작할 수 있음
- [ ] S02에서 녹음 mock 또는 텍스트로 사건 내용을 입력할 수 있음
- [ ] S03에서 내용·위치·시간을 수정할 수 있음
- [ ] S04 질문이 하나씩 표시되고 답변이 보존됨
- [ ] S05 사건카드를 수정하고 저장 성공 상태를 볼 수 있음
- [ ] 뒤로 이동해도 기존 입력이 의도대로 유지됨

### 상태와 기기

- [ ] 로딩 중 중복 제출이 차단됨
- [ ] 필수 입력 오류가 해당 입력 근처에 표시됨
- [ ] mock 실패 후 입력을 잃지 않고 재시도 가능
- [ ] 작은 화면과 키보드가 열린 상태에서도 주요 버튼 사용 가능
- [ ] Android 또는 iOS 기기에서 전체 흐름 확인
- [ ] 마이크 권한 거부 시 텍스트 대체 입력이 있음
- [ ] 위치 권한 거부 시 장소 직접 입력이 있음

### 보안과 협업

- [ ] fixture에 실제 개인정보가 없음
- [ ] 민감한 사건 정보와 비밀번호를 로그·URL에 넣지 않음
- [ ] API 계약 변경은 `packages/shared`와 `docs/API.md`에 함께 반영
- [ ] PR에 실제 확인한 기기, 실행 방법, 정상·오류 화면 자료를 남김

## 10. 지금 바로 할 일

1. 현재 앱을 실행하고 임시 홈이 보이는지 확인한다.
2. `AppScreen`, `FlowHeader`, `ProgressBar`를 구현한다.
3. `app/case/_layout.tsx`와 `CaseDraftProvider`를 만든다.
4. 가짜 분실 사건 fixture와 `mockCaseFlow`를 만든다.
5. S01과 S02를 먼저 구현하고 실제 기기에서 이동을 확인한다.
6. 같은 draft를 사용해 S03, S04, S05를 순서대로 연결한다.
7. 질문 순차 표시, 뒤로가기 입력 보존, 오류·재시도를 검증한다.
8. 화면 5개가 안정된 뒤 마이크와 위치를 붙인다.
9. draft token, 질문 답변, 사건카드 수정 계약을 백엔드와 해결한다.
10. 계약이 정리되면 mock adapter를 실제 API adapter로 교체한다.
