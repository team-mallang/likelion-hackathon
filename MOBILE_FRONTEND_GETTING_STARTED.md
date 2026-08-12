# S17 제휴 보험상품 안내 모바일 구현 가이드

이 문서는 `docs/USER_FLOW.md`에 정의된 S17 제휴 보험상품 안내 화면을 구현하는 단계별 가이드다. 기존 보험금 청구 분석·사후처리 화면이 아니라, S06 서류함에서 진입해 서비스가 제휴한 여행자보험 상품을 소개하고 가입을 유도하는 홍보 목적 화면만 다룬다.

S17은 사용자의 보험증권·사건 상세·신고서 사진을 분석하지 않는다. 보험 가입 여부와 보험사 선택은 화면 로컬 상태로만 관리하고, 실제 제휴 상품·외부 링크·광고 고지는 사업 계약 확정 후 연결한다.

## 시작 전 기준선

```cmd
git status --short
pnpm.cmd --filter mobile typecheck
git diff --check
```

관련 화면과 기반:

- S06 서류함 route와 `DocumentsScreen`
- 공통 헤더·버튼·카드·웹 layout
- `apps/mobile/src/theme/tokens.ts`
- `docs/USER_FLOW.md`의 S17 화면 계약

## 0단계 — 제품·제휴·표현 계약 확정

현재 완료: S17 목적을 제휴 보험상품 소개·가입 유도로 제한하고, S06 `보험상품 확인하기` 진입·민감정보 비수집·보상 보장 표현 금지·제휴/광고 고지 경계를 타입과 navigation source 계약으로 확정했다.

1. S06 서류함 하단에 `보험상품 확인하기` 버튼을 추가하고 `/case/insurance-products` route로 이동시킨다.
2. S17의 목적을 제휴 보험사·여행자보험 상품 소개와 가입 유도로 제한한다.
3. `맞춤형 청구 가이드 생성`, `청구 가능`, `보험금 지급`, `보상 확정` 표현은 사용하지 않는다.
4. 실제 노출 보험사·상품명·로고·순서·외부 URL·제휴 기간을 사업 계약으로 확정한다.
5. 보험 가입 여부와 선택 보험사는 기본적으로 화면 세션 로컬 상태로만 유지한다. 사건·사용자 계정·보험증권 정보와 결합하지 않는다.
6. 광고·제휴 고지, 약관 확인 문구, 외부 페이지 이동 정책을 확정한다.

완료 기준: S06 → S17 진입 조건, 제휴 상품 목록, 고지 문구, 외부 이동 경계가 문서로 확정된다.

## 1단계 — domain type과 service interface

현재 완료: `insurance-products` feature에 제휴 상품·상태·overview 타입, active 상품 필터, HTTPS 링크 검증, 안전한 오류 코드, S06 source-only navigation state, mock service와 정상·empty·실패 테스트를 추가했다.

권장 위치:

```text
apps/mobile/src/features/insurance-products/
  types/insuranceProducts.ts
  services/insuranceProducts.ts
  services/mockInsuranceProducts.ts
  services/insuranceProductsNavigation.ts
  utils/insuranceProductsDisplay.ts
```

권장 타입:

```ts
type InsuranceProductStatus = "ACTIVE" | "INACTIVE";

type PartnerInsuranceProduct = {
  id: string;
  insurerName: string;
  productName: string;
  logoAsset?: string;
  detailUrl?: string;
  status: InsuranceProductStatus;
  disclosureLabel: string;
};

type InsuranceProductsOverview = {
  products: PartnerInsuranceProduct[];
  updatedAt?: string;
};

type InsuranceProductsService = {
  listActiveProducts(): Promise<InsuranceProductsOverview>;
};
```

서비스 규칙:

- inactive 상품과 계약되지 않은 보험사는 View에 전달하지 않는다.
- 보험 가입 여부나 보험증권 번호를 service 요청값으로 받지 않는다.
- 외부 URL은 허용된 제휴 도메인인지 검증한 뒤 반환한다.
- 서버·제휴 provider 오류 원문은 화면에 노출하지 않고 안전한 오류 코드로 변환한다.

## 2단계 — View 계약과 정적 화면

현재 완료: `InsuranceProductsViewProps`와 모바일·웹 View를 추가했다. 안내 카드, 여행자보험 가입 여부 토글, 제휴 보험사 카드 그리드, 선택 상태, loading/empty/failed 상태, 제휴 상품 보기 CTA, 약관·제휴 고지와 하단 내비게이션을 정적으로 렌더링한다.

`InsuranceProductsViewProps`는 상품 목록, 로딩/실패 상태, 가입 여부 토글 상태, 선택 보험사 ID, callback만 받는다. View는 service·router·외부 브라우저를 직접 호출하지 않는다.

화면 순서:

1. 상단 헤더: 뒤로가기, 중앙 `Ansim Travel`, 프로필 아이콘
2. 제목 `가입하신 보험이 있나요?`
3. 설명 `정확한 맞춤형 안내를 위해 보험 정보를 선택해 주세요.`
4. 안내 카드
   - `여행 중 사건이 발생하면 여행자보험을 통해 일정 부분 보상받을 수 있습니다. 제휴 보험상품을 확인해 보세요.`
5. `여행자보험 가입 여부` 토글
6. `보험사 선택` 제휴 상품 카드 그리드
7. 선택된 카드 강조 상태
8. `보험사 직접 입력`은 제휴 외 상품 분석으로 오해되지 않게 숨기거나 비활성 처리
9. primary `제휴 상품 보기` 또는 `보험상품 확인하기`
10. 약관·보상 조건 안내와 제휴/광고 고지

상태별 정적 UI:

- loading: 상품 카드 skeleton과 `보험상품 정보를 준비하고 있습니다.`
- empty: `현재 안내할 수 있는 제휴 보험상품이 없습니다.`
- failed: `보험상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.`
- loaded: 제휴 상품 카드와 선택 상태
- selected: 선택된 상품 border·badge·CTA 활성화

## 3단계 — Screen·route·S06 연결

현재 완료: `/case/insurance-products` route와 `InsuranceProductsScreen`을 추가하고 S06 서류함의 `보험상품 확인하기` 버튼을 연결했다. Screen은 mock 상품 목록·로컬 토글·선택 상태·HTTPS 외부 링크 검증을 소유하며, 뒤로가기·탭 이동 시 navigation state를 정리한다.

1. `/case/insurance-products` route는 `InsuranceProductsScreen`만 렌더링한다.
2. `DocumentsScreen`의 S06 `보험상품 확인하기` 버튼은 사건 데이터나 보험 정보를 route param에 넣지 않고 S17로 이동한다.
3. Screen은 `LOADING → LOADED/EMPTY/FAILED` 상태를 소유한다.
4. 보험 가입 여부 토글과 선택 보험사 ID는 Screen 로컬 상태로 유지한다.
5. `제휴 상품 보기`를 누르면 선택 상품의 허용된 detail URL을 외부 브라우저 또는 제휴 상세 route로 전달한다.
6. 뒤로가기와 사건·가이드·서류 탭 이동 시 S17 로컬 선택 상태를 정리한다.
7. 활성 사건이 없어도 보험상품 안내 자체가 가능한지 정책을 정하고, 필요하면 민감정보 없는 독립 화면으로 fallback한다.

## 4단계 — mock·제휴 API adapter

현재 완료: `createPartnerInsuranceProductsService`를 추가해 제휴 API 응답에서 유효한 ACTIVE 상품만 매핑하고, 허용 host가 아닌 detail URL은 제거하며 provider 원문 오류를 안전한 `PRODUCTS_UNAVAILABLE` 오류로 변환했다. 실제 endpoint 연결은 사업 계약 후 설정한다.

1. mock service에 정상 목록, 빈 목록, inactive 필터링, 네트워크 실패 fixture를 추가한다.
2. mock 상품은 실제 보험 가입이나 보장 가능성을 의미하지 않는 샘플임을 코드·UI에서 분리한다.
3. 실제 API adapter는 `InsuranceProductsService` 뒤에 둔다.
4. API 응답에서 보험사명·상품명·logo·허용 URL·고지 문구만 매핑하고, 보험증권·사건·신고서 데이터는 받지 않는다.
5. 외부 URL은 allowlist 또는 서버 발급 링크만 허용한다. 임의 URL을 그대로 WebView에 열지 않는다.
6. 상품 업데이트 시 inactive 상품은 즉시 숨기고, 캐시 만료·재시도·timeout 상태를 명시적으로 처리한다.

## 5단계 — 개인정보·표현 안전성·접근성·웹 fallback

현재 완료: S17 View에 가입 여부 토글·상품 카드 selected·CTA disabled·안내 alert·헤더/카드 접근성 label을 적용했고, 사건·보험증권·신고서 데이터를 요청하지 않는 mock/API 계약을 유지한다. 웹은 동일 View props와 키보드 조작 가능한 Pressable/Switch 구조를 사용한다.

- 주민번호, 보험증권 번호, 가입 증빙, 사건 상세, 신고서 사진을 요구하거나 로그에 남기지 않는다.
- 가입 여부 토글과 보험사 선택값을 사건 카드·S07 문서·S16 검수 결과와 결합하지 않는다.
- 제휴·광고·홍보 성격을 화면에 표시하고, 보상 조건은 각 보험사 약관을 확인해야 한다고 안내한다.
- 상품 카드에는 `보험사명과 상품명 보기`, 토글에는 `여행자보험 가입 여부` label을 제공한다.
- 선택된 카드는 `accessibilityState={{ selected: true }}`를 전달한다.
- 로딩 CTA는 `busy`, 이동 불가 CTA는 `disabled`, API 실패는 `alert`로 전달한다.
- 웹에서는 키보드만으로 뒤로가기·토글·카드 선택·CTA·하단 탭을 조작할 수 있어야 한다.
- 480px 이하 폭에서 2열 카드가 겹치지 않고, 긴 보험사명·상품명이 줄바꿈되도록 한다.

## 6단계 — 정적 검사와 테스트

현재 완료: S17 feature 범위에서 민감정보·과도한 보험 보장 표현 정적 검색을 수행했고, 모바일 typecheck·diff 검사를 통과했다. 기존 회귀 테스트와 S17 mock·navigation·partner adapter 테스트를 포함한 전체 테스트 40개가 통과했다.

```cmd
pnpm.cmd --filter mobile typecheck
pnpm.cmd --filter mobile test
git diff --check
```

최소 테스트 범위:

- S06 버튼이 민감정보 없이 S17 route로 이동하는지
- active 상품만 노출되고 inactive 상품이 필터링되는지
- 정상·empty·failed·timeout 상태의 안전한 문구
- 보험 가입 여부 토글과 상품 선택이 로컬 상태에서만 변경되는지
- 상품 미선택 시 CTA가 비활성화되는지
- 허용되지 않은 외부 URL이 열리지 않는지
- route·로그·analytics에 보험증권·사건·신고서 정보가 없는지
- 웹 접근성 label·selected·busy·disabled 및 480px layout

정적 검색 예시:

```cmd
rg -n "policyNumber|insuranceNumber|resident|caseDetail|reportPhoto|base64|console\\.|analytics" apps\\mobile\\src\\features\\insurance-products
rg -n "보험금 지급|청구 가능|보상 확정|맞춤형 청구" apps\\mobile\\src\\features\\insurance-products docs\\USER_FLOW.md
```

## 7단계 — 실기기·웹 QA

1. S06 서류함에서 `보험상품 확인하기`를 눌러 S17로 이동한다.
2. 제휴 보험사 카드 선택과 선택 해제를 확인한다.
3. 보험 가입 여부 토글이 사건 데이터나 문서 상태를 바꾸지 않는지 확인한다.
4. `제휴 상품 보기`가 계약된 URL로만 이동하는지 확인한다.
5. 제휴 상품 없음·네트워크 실패·외부 링크 실패 상태를 확인한다.
6. iOS·Android·웹에서 약관/제휴 고지, VoiceOver·TalkBack·키보드, 480px layout을 확인한다.

실기기 QA 전에는 S17을 보험금 청구나 보장 판정 화면으로 설명하지 않는지 제품·법무 문구를 최종 검토한다.
