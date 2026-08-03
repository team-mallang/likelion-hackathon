# 모바일 애플리케이션 구조

`app`은 Expo Router의 경로와 화면 조합만 담당하고, 실제 UI와 기능 로직은 `src`에 둡니다.

## 라우트

```text
app/
├── index.tsx                         # S01 홈
├── case/
│   ├── new/                          # S02 음성 인식
│   ├── review/                       # S03 내용 확인
│   ├── questions/                    # S04 추가 질문
│   ├── confirmation/                 # S05 사건 카드 확정
│   ├── setup/                        # S06 사건번호·비밀번호 설정
│   ├── lookup/                       # S08 이전 사건 조회
│   └── [caseNumber]/
│       ├── guide/                    # S07 해결 가이드
│       ├── documents/                # S09 서류함
│       ├── places/                   # S10 지도·주변 기관
│       ├── police/                   # S11 경찰서 대응
│       ├── translation/              # 양방향 통역
│       ├── report/                   # 신고서 초안·업로드
│       └── insurance/                # 보험·사후 처리
└── _layout.tsx
```

각 라우트가 구현될 때 해당 폴더에 `index.tsx`를 만들고, `src/features`의 화면 컴포넌트만 조합합니다.

## 소스

```text
src/
├── components/
│   ├── common/                       # 버튼, 입력, 카드 등 기본 UI
│   ├── feedback/                     # 로딩, 오류, 빈 상태
│   ├── forms/                        # 공통 폼 UI
│   └── layout/                       # 화면 컨테이너, 헤더, 하단 탭
├── features/
│   ├── home/                         # S01
│   ├── case/                         # S02~S06, S08
│   ├── guide/                        # S07
│   ├── documents/                    # S09와 신고서
│   ├── places/                       # S10
│   ├── police/                       # S11
│   ├── translation/                  # 실시간 통역
│   └── insurance/                    # 보험·사후 처리
├── services/
│   ├── api/                          # HTTP client와 응답 검증
│   ├── device/                       # 마이크, 위치, 카메라 권한 경계
│   └── storage/                      # 안전한 로컬 저장 경계
├── hooks/                            # 여러 기능에서 공유하는 hook
├── theme/                            # 색상, 간격, typography 토큰
├── utils/                            # 부작용 없는 공통 함수
└── mocks/                            # API 계약과 동일한 테스트 fixture
```

기능별 상태, 화면, 컴포넌트, hook은 각 `src/features/<feature>` 내부에 함께 둡니다. API 호출과 기기 기능은 화면에서 직접 사용하지 않고 `services`를 통해 접근합니다.
