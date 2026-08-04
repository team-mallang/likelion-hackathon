# 모바일 라우트 및 소스 구조 확정안

> GitHub Issue에 이 문서 내용을 그대로 복사하여 사용한다.

## 목적

`docs/USER_FLOW.md`의 S01~S11 화면과 루트 `README.md`의 모바일 기능 범위를 기준으로 Expo Router 라우트와 `src` 책임을 확정한다.

## 구조 원칙

- `app`은 Expo Router 라우트 선언과 화면 조합만 담당한다.
- 실제 UI, 상태, 입력 검증, 기능 로직은 `src/features`에 둔다.
- API 호출, 응답 검증, 외부 서비스 연동은 `src/services`를 통해서만 수행한다.
- 사건번호 발급 전 생성 흐름은 `/case/*`에 둔다.
- 사건번호 발급 후 사건별 화면은 `/case/[caseNumber]/*`에 둔다.
- 비밀번호를 URL, 라우트 파라미터, 로그, 분석 이벤트에 포함하지 않는다.
- S11 경찰서 대응 화면이 양방향 음성 인식·번역을 포함하므로 별도의 중복 통역 라우트는 만들지 않는다.
- 하단 사건·가이드·서류 탭은 공통 `CaseBottomTabs` 컴포넌트로 구현한다.

## 확정 라우트

| 화면 | Expo Router 경로 | 파일 | 책임 |
|---|---|---|---|
| S01 홈 | `/` | `app/index.tsx` | 새 사건 시작, 이전 사건 조회 진입 |
| S02 음성 인식 | `/case/new` | `app/case/new/index.tsx` | 음성 녹음·인식, 텍스트 대체 입력 |
| S03 내용 확인 | `/case/review` | `app/case/review/index.tsx` | 인식 내용·위치·발생 시간 확인 및 수정 |
| S04 추가 질문 | `/case/questions` | `app/case/questions/index.tsx` | AI가 생성한 누락 정보 질문과 사용자 답변 |
| S05 사건 카드 확정 | `/case/confirmation` | `app/case/confirmation/index.tsx` | 사건 카드 검토, 분실·도난 유형 최종 확인 |
| S06 사건번호·비밀번호 설정 | `/case/setup` | `app/case/setup/index.tsx` | 사건번호 표시, 비밀번호 설정 및 사건 저장 |
| 활성 사건 요약 | `/case/[caseNumber]` | `app/case/[caseNumber]/index.tsx` | 확정된 사건 카드와 처리 상태 표시 |
| S07 가이드 | `/case/[caseNumber]/guide` | `app/case/[caseNumber]/guide/index.tsx` | 맞춤 행동 가이드, 완료·순서 변경 |
| S08 이전 사건 조회 | `/case/lookup` | `app/case/lookup/index.tsx` | 사건번호·비밀번호 인증과 사건 복원 |
| S09 서류함 | `/case/[caseNumber]/documents` | `app/case/[caseNumber]/documents/index.tsx` | 사건 카드, 신고서, 증빙 자료, 보험 서류 허브 |
| S10 지도 | `/case/[caseNumber]/places` | `app/case/[caseNumber]/places/index.tsx` | 가까운 경찰서·기관 검색, 지도와 길찾기 |
| S11 경찰서 대응 | `/case/[caseNumber]/police` | `app/case/[caseNumber]/police/index.tsx` | 현지어 상황 설명, 양방향 음성 인식·번역 |
| 신고서 처리 | `/case/[caseNumber]/report` | `app/case/[caseNumber]/report/index.tsx` | 신고서 초안, 촬영·업로드, 누락 항목 확인 |
| 보험·사후 처리 | `/case/[caseNumber]/insurance` | `app/case/[caseNumber]/insurance/index.tsx` | 보험 정보, 제출 서류, RAG 안내와 내용 비교 |

`활성 사건 요약`, `신고서 처리`, `보험·사후 처리`는 README의 전체 기능 범위를 반영한 라우트다. S01~S11 번호 화면과 구분하되 S09 서류함 및 하단 탭에서 진입한다.

## 라우트 디렉터리

```text
apps/mobile/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx                              # S01 홈
│   └── case/
│       ├── new/
│       │   └── index.tsx                      # S02 음성 인식
│       ├── review/
│       │   └── index.tsx                      # S03 내용 확인
│       ├── questions/
│       │   └── index.tsx                      # S04 추가 질문
│       ├── confirmation/
│       │   └── index.tsx                      # S05 사건 카드 확정
│       ├── setup/
│       │   └── index.tsx                      # S06 사건번호·비밀번호 설정
│       ├── lookup/
│       │   └── index.tsx                      # S08 이전 사건 조회
│       └── [caseNumber]/
│           ├── _layout.tsx                    # 사건 인증·공통 레이아웃 경계
│           ├── index.tsx                      # 활성 사건 요약
│           ├── guide/
│           │   └── index.tsx                  # S07 가이드
│           ├── documents/
│           │   └── index.tsx                  # S09 서류함
│           ├── places/
│           │   └── index.tsx                  # S10 지도
│           ├── police/
│           │   └── index.tsx                  # S11 경찰서 대응·통역
│           ├── report/
│           │   └── index.tsx                  # 신고서 처리
│           └── insurance/
│               └── index.tsx                  # 보험·사후 처리
└── src/
```

## 주요 화면 이동

```text
S01 홈
├── 새 사건 시작 → S02 → S03 → S04 → S05 → S06 → S07
└── 이전 사건 조회 → S08 → 인증 성공 → S07

S07 가이드
├── 가까운 경찰서 확인 → S10
├── 서류 탭 → S09
└── 사건 탭 → 활성 사건 요약

S10 지도
└── 경찰서 도착·소통 시작 → S11

S09 서류함
├── 신고서 생성·업로드·분석 → 신고서 처리
└── 보험 제출 서류 가이드 → 보험·사후 처리
```

## 하단 탭 경로

| 탭 | 이동 경로 | 활성 사건이 없을 때 |
|---|---|---|
| 사건 | `/case/[caseNumber]` | `/` |
| 가이드 | `/case/[caseNumber]/guide` | `/case/lookup` |
| 서류 | `/case/[caseNumber]/documents` | `/case/lookup` |

S10과 S11에서는 사건 탭을 활성 상태로 표시하되, 탭을 다시 누르면 `/case/[caseNumber]`로 이동한다.

## 소스 디렉터리

```text
src/
├── components/
│   ├── common/                       # Button, Card, IconButton 등 기본 UI
│   ├── feedback/                     # Loading, Error, Empty, Retry 상태
│   ├── forms/                        # Input, PasswordInput, ValidationMessage
│   └── layout/                       # Screen, Header, ProgressHeader, CaseBottomTabs
├── features/
│   ├── home/                         # S01
│   ├── case/
│   │   ├── components/               # 사건 카드·물품·진행률 공통 UI
│   │   ├── hooks/                    # 사건 생성·조회·입력 상태
│   │   ├── screens/                  # S02~S06, S08, 활성 사건 요약
│   │   ├── services/                 # 사건 API adapter와 mock adapter
│   │   └── types/                    # 화면 전용 상태 타입
│   ├── guide/                        # S07
│   ├── documents/                    # S09, 신고서 처리
│   ├── places/                       # S10
│   ├── police/                       # S11, 실시간 통역
│   └── insurance/                    # 보험·사후 처리
├── services/
│   ├── api/                          # base URL, timeout, JSON·Zod 검증, 오류 변환
│   ├── device/                       # 마이크, 위치, 카메라, 클립보드 권한 경계
│   └── storage/                      # 안전한 로컬 저장 경계
├── hooks/                            # 여러 feature가 공유하는 hook
├── theme/                            # colors, spacing, typography, radius, shadow
├── utils/                            # 부작용 없는 공통 함수
└── mocks/                            # 공유 Zod 계약을 통과하는 fixture
```

## 라우트 구현 규칙

- `app/**/index.tsx`에서는 `src/features/**/screens`를 import하여 렌더링만 한다.
- 사건 생성 중 입력값은 S02~S06 뒤로 가기에도 유지한다.
- S06 완료 후 사건번호를 활성 사건 상태에 저장하고 동적 라우트로 이동한다.
- `[caseNumber]` 레이아웃은 활성 사건과 URL 사건번호가 일치하는지 확인한다.
- 재조회 인증은 S08에서만 수행하며 인증 실패 메시지로 사건 존재 여부를 노출하지 않는다.
- 서버 응답은 `@project/shared`의 Zod 스키마로 검증한 후 화면에 전달한다.
- 마이크·위치·카메라 권한은 해당 기능 사용 시점에 요청하고 거부 대체 흐름을 제공한다.
- 비밀번호 원문은 영구 저장, URL 포함, 로그 출력, 사건번호와 함께 복사하지 않는다.
- S11 통역 세션은 필요한 대화 요약만 저장하고 원본 음성 보관 정책을 별도로 적용한다.

## 완료 조건

- [ ] 위 디렉터리와 `index.tsx` 라우트 파일 생성
- [ ] 모든 라우트 파일을 `src/features` 화면 컴포넌트와 연결
- [ ] S01에서 S02와 S08로 이동 가능
- [ ] mock 데이터로 S02 → S03 → S04 → S05 → S06 → S07 이동 가능
- [ ] S08 인증 성공 mock으로 사건번호 기반 S07 이동 가능
- [ ] S07 → S10 → S11 이동 가능
- [ ] 활성 사건의 사건·가이드·서류 하단 탭 이동 가능
- [ ] 권한 거부·로딩·오류·재시도 UI 경계 마련
- [ ] 비밀번호가 URL·로그·영구 저장소에 남지 않음
- [ ] `pnpm --filter mobile typecheck` 통과
- [ ] `git diff --check` 통과
