# S12 인근 기관 안내 모바일 구현 가이드

이 문서는 `docs/USER_FLOW.md`에 확정된 S12 인근 기관 안내 화면을 현재 모바일 코드 구조에 맞춰 구현하는 순서다.

S09·S14의 완료된 구현 절차는 이 문서에서 제거했다. 해당 화면의 최종 UI·기능 기준은 계속 `docs/USER_FLOW.md`를 따른다. S12도 구현의 최종 문구·정보 순서·상태 기준은 항상 `docs/USER_FLOW.md`다.

---

## 1. 목표와 범위

S12는 현재 위치 또는 사용자가 선택한 위치를 기준으로 인근 경찰서, 파출소, 분실물 보관 기관과 대사관을 찾고 길찾기·전화 연결을 제공한다.

```text
S11 인근 기관 찾기 action
  → S12 위치 권한 확인 또는 수동 위치 선택
  → 지도와 인근 기관 목록 조회
  → 기관 선택
  → 길찾기 또는 전화하기
```

이번 구현 범위:

- `/case/nearby-agencies` route, Screen, 모바일·웹 View와 공통 View props
- 지도 영역, 선택 기관 요약 카드, 거리순 기관 목록과 하단 탭의 정적 UI
- 위치·지도·기관 목록·길찾기·전화의 loading·오류·빈 상태
- mock service로 경찰서·파출소·분실물 보관 기관·대사관 fixture 재현
- S11 action에서 S12로 이동하고 S12의 `가이드`·`서류` 탭을 S11·S07에 연결
- 위치 권한, 외부 길찾기·전화 adapter와 개인정보·접근성·웹 fallback 경계

정책 확정 전 구현하지 않는 것:

- 실제 위치·이동 이력의 장기 저장 또는 analytics 전송
- 정확하지 않은 거리·운영 시간·전화번호를 성공 데이터처럼 표시
- 위치 권한 거부 시 기관 도움 요청 자체를 막는 흐름
- 기관 번호를 자동으로 발신하거나 외부 지도 앱을 사용자 동의 없이 실행하는 동작
- 지도 SDK가 웹에서 지원되지 않는 상황을 무시하고 화면 전체를 실패시키는 동작

---

## 2. 시작 전 기준선과 결정 사항

먼저 현재 상태를 확인한다.

```cmd
git status --short
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

이미 존재하는 기반:

- `ActiveCaseContext`의 활성 사건과 선택적 `accessToken`
- `/case/guides` S11, `/case/documents` S07, `CaseBottomNavigation`
- route는 Screen만 렌더링하고 Screen·View·service를 분리하는 구조
- 모바일·웹 공통 `*.types.ts` View 계약, `AppScreen`, `ErrorState`, `LoadingState`, 디자인 토큰
- S11의 서버 검증 action 유형을 기준으로 목적 화면을 연결하는 방식

아래 제품 결정은 백엔드·지도 provider·기획 계약에서 확정할 항목이다. 프론트는 결정을 임의로 만들지 않고, 계약 전에는 mock과 안전한 fallback만 사용한다.

1. S12 route 이름
   - 이 문서의 제안: `/case/nearby-agencies`
2. 지도 provider와 지원 범위
   - native 지도, 웹 지도, 외부 지도만 제공하는 fallback 중 팀 표준을 확정한다.
3. 위치 기준
   - 현재 GPS 위치, 수동 검색 위치, 사건 발생 위치 중 기본 조회 기준을 확정한다.
4. 기관 데이터 출처
   - 경찰서·파출소·분실물 보관 기관·대사관의 좌표, 전화번호, 운영 시간 검수 주체와 갱신 주기를 확정한다.
5. 길찾기와 전화 정책
   - 내부 지도, 외부 지도 앱, 웹 URL과 주소 복사 fallback의 우선순위를 정한다.
6. S11 action 유형
   - 제안: `NEARBY_AGENCIES`. 제목 문자열이나 `guideId`로 route를 결정하지 않는다.

백엔드·지도 API가 아직 없어도 1~3단계의 타입, View, mock, Screen과 route는 진행한다.

---

## 3. 공통 책임과 feature 구조

기존 책임 분리를 유지한다.

```text
route: Screen만 렌더링
Screen: Router, ActiveCase, service, 비동기 상태와 선택 기관 상태
View: props 렌더링과 사용자 이벤트 전달
service: 기관 API와 mock 응답 정규화
device adapter: 위치 권한, 지도, 외부 길찾기·전화 실행
```

View에서 Router, Context, 위치 SDK, 지도 SDK, `Linking` 또는 API client를 직접 호출하지 않는다.

권장 구조:

```text
apps/mobile/app/case/nearby-agencies/index.tsx

apps/mobile/src/features/nearby-agencies/
  screens/NearbyAgenciesScreen.tsx
  services/nearbyAgencies.ts
  services/mockNearbyAgencies.ts
  services/locationPermission.ts
  services/openDirections.ts
  types/nearbyAgencies.ts
  views/NearbyAgenciesView.tsx
  views/NearbyAgenciesView.web.tsx
  views/NearbyAgenciesView.types.ts
  components/AgencyMap.tsx
  components/SelectedAgencyCard.tsx
  components/NearbyAgencyList.tsx

apps/mobile/src/services/device/
  locationPermission.ts
  directions.ts
  phoneCall.ts
```

지도 provider가 native 전용이면 `AgencyMap.native.tsx`와 `AgencyMap.web.tsx`를 분리한다. 웹 구현은 지도 이미지를 흉내 내기보다 목록·선택 카드·외부 길찾기 fallback을 항상 제공한다.

---

## 4. 0단계 — S12 데이터·외부 연동 계약

### 4.1 기관 조회 계약

현재 완료: `features/nearby-agencies/types/nearbyAgencies.ts`와 `services/nearbyAgencies.ts`에 기관 조회 query/result, 기관 유형·운영 상태·이동 수단과 service error code를 정의했다. 실제 HTTP client는 백엔드 endpoint와 인증 계약 확정 뒤 주입한다.

백엔드 API가 생기기 전에는 interface와 mock 응답을 먼저 확정한다.

```ts
type NearbyAgenciesQuery = {
  caseId: string;
  accessToken?: string;
  location: { latitude: number; longitude: number };
  sort: "DISTANCE";
  types?: AgencyType[];
};

type NearbyAgenciesResult = {
  referenceLocation: { latitude: number; longitude: number };
  agencies: NearbyAgency[];
  fetchedAt: string;
};

type NearbyAgenciesService = {
  getNearbyAgencies(query: NearbyAgenciesQuery): Promise<NearbyAgenciesResult>;
};
```

계약 원칙:

- 거리와 예상 시간은 서버 또는 검증된 지도 provider가 반환한 값만 표시한다.
- 운영 상태의 기준 시각·시간대가 없으면 `UNKNOWN`으로 전달한다.
- 기관 목록은 사용자 식별 정보나 사건 상세를 포함하지 않는다.
- 좌표·전화번호·주소는 UI에 필요한 범위로만 전달하며 log에 남기지 않는다.

### 4.2 위치·길찾기·전화 adapter 계약

현재 완료: `services/locationPermission.ts`, `services/directions.ts`, `services/phoneCall.ts`에 위치 권한·현재 위치, 외부 길찾기, 전화 실행의 입력·오류 경계를 정의했다. 실제 Expo/React Native adapter는 4단계에서 구현한다.

```ts
type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

type LocationPermission = {
  status: "granted" | "denied" | "undetermined";
  canAskAgain: boolean;
};

type DirectionsTarget = {
  latitude: number;
  longitude: number;
  label: string;
};
```

- `locationPermission`은 권한 상태 확인·요청만 담당한다.
- `directions`는 선택 기관의 좌표·표시명만 외부 지도 또는 내부 지도에 전달한다.
- `phoneCall`은 명시적인 버튼 action 뒤 기관 전화번호만 기기 전화 기능으로 전달한다.
- adapter 오류 메시지는 원격 provider 원문이 아닌 안전한 사용자 문구로 치환한다.

### 4.3 S11 action 계약

현재 완료: `GuideActionType`에 `NEARBY_AGENCIES`를 추가했다. S11 Screen의 실제 route handler와 mock guide fixture 연결은 3단계에서 진행한다.

`GuideActionType`에 `NEARBY_AGENCIES`를 추가하고, Screen은 이 명시적 action에서만 S12 route로 이동한다.

```ts
type GuideActionType =
  | "POLICE_SUPPORT"
  | "NEARBY_AGENCIES"
  | "...";
```

0단계 완료 기준:

- 기관·위치·길찾기·전화 타입과 실패 코드가 문서·type 파일에서 일치한다.
- 지도 provider 비밀값, 위치 이력과 전화번호가 route param·View props 외부·로그에 섞이지 않는다.
- mock service는 3단계에서 이 계약과 같은 타입을 반환하도록 구현한다.

0단계 현재 상태:

- 4.1 기관 조회 계약 완료
- 4.2 위치·길찾기·전화 adapter 계약 완료
- 4.3 `NEARBY_AGENCIES` action 타입 계약 완료
- 실제 백엔드 endpoint, 지도 provider, 위치 기준, 기관 데이터 출처와 외부 앱 정책은 백엔드·기획 확정 대기

---

## 5. 1단계 — S12 domain type과 service interface

현재 완료: `types/nearbyAgencies.ts`에 S12 기관·위치·거리·운영 상태·이동 수단·조회 query/result 타입을 정의했고, `services/nearbyAgencies.ts`에 service interface와 실패 코드를 분리했다. `utils/nearbyAgencyDisplay.ts`에는 기관 유형·운영 상태·이동 수단 label, 거리·시간 formatter, 거리순 정렬 함수를 추가했다. 관련 순수 함수 테스트 3개를 포함해 `pnpm.cmd --filter mobile test`로 검증한다.

`apps/mobile/src/features/nearby-agencies/types/nearbyAgencies.ts`에 아래 계약을 작성한다.

```ts
type AgencyType =
  | "POLICE_STATION"
  | "POLICE_BOX"
  | "LOST_AND_FOUND"
  | "EMBASSY";

type OperatingStatus = "OPEN" | "CLOSED" | "UNKNOWN";
type TravelMode = "WALK" | "DRIVE" | "TRANSIT";

type NearbyAgency = {
  agencyId: string;
  type: AgencyType;
  name: string;
  address: string;
  phoneNumber?: string;
  latitude: number;
  longitude: number;
  operatingStatus: OperatingStatus;
  operatingStatusLabel: string;
  distanceMeters?: number;
  travelMode?: TravelMode;
  travelDurationMinutes?: number;
  isNearest: boolean;
  directionsAvailable: boolean;
};
```

함께 작성할 항목:

- API·mock이 공유하는 `NearbyAgenciesService`와 `NearbyAgenciesServiceError`
- 거리·시간이 없는 상태를 표현하는 optional field와 사용자용 fallback label
- `AgencyType`과 `OperatingStatus`의 UI label·icon mapping 순수 함수
- S11에서 전달할 목적 action type

완료 기준:

- `pnpm.cmd --filter mobile typecheck` 통과
- 기관 유형·운영 상태가 색상만 없이 텍스트로 표시될 수 있다.
- 거리·시간 미확인 상태가 `0m`, `0분`으로 오해되지 않는다.

1단계 현재 상태:

- domain type과 service interface 구현 완료
- 기관 유형·운영 상태·이동 수단 label 및 거리순 정렬 순수 함수 구현 완료
- S12 신규 테스트 3개를 포함한 전체 mobile 테스트 9개 통과

---

## 6. 2단계 — S12 View 계약과 정적 화면

현재 완료: `views/NearbyAgenciesView.types.ts`에 공통 View props 계약을 정의하고, 모바일·웹 공통 화면에 지도 placeholder, 선택 기관 카드, 거리순 기관 목록, 길찾기·전화 CTA, loading·오류·빈 상태와 `가이드` 활성 하단 탭을 구현했다. 정적 fixture에는 경찰서·파출소·분실물 보관 기관·대사관과 운영 상태·거리·긴 주소 사례를 포함했다. 실제 지도·위치·기관 API는 아직 호출하지 않는다.

### 6.1 `NearbyAgenciesViewProps`

View는 아래 표시 값과 이벤트만 받는다.

```ts
type NearbyAgenciesViewProps = {
  referenceLocation: DeviceLocation | null;
  agencies: NearbyAgency[];
  selectedAgencyId: string | null;
  sort: "DISTANCE";
  isLoadingLocation: boolean;
  isLoadingAgencies: boolean;
  locationErrorMessage: string | null;
  agenciesErrorMessage: string | null;
  mapStatus: "READY" | "UNAVAILABLE" | "LOADING";
  onBack: () => void;
  onSelectAgency: (agencyId: string) => void;
  onRequestCurrentLocation: () => void;
  onToggleMapLayer: () => void;
  onOpenDirections: () => void;
  onCallAgency: () => void;
  onOpenAllAgencies: () => void;
  onRetryAgencies: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
```

### 6.2 화면 순서

1. 헤더: 뒤로가기, `주변 기관 안내`, 우측 `3/6`
2. 지도 또는 지도 fallback
   - 현재 위치 버튼, 지도 레이어 버튼
   - 현재 위치·선택 기관 marker와 label
3. 선택 기관 카드
   - `가장 가까운 곳`, 운영 상태, 거리·도보 시간, 기관명, 주소
   - primary `길찾기`, secondary `전화하기`
4. `주변 기관 리스트`와 `거리순` 정렬 label
5. 기관 행 목록
   - 기관 유형, 이름, 운영 상태, 거리·이동 시간, 상세 선택 affordance
6. `모든 주변 기관 보기`
7. `사건`, `가이드`, `서류` 하단 탭 — S12는 `가이드` 활성

### 6.3 정적 fixture

최소 fixture를 준비한다.

- 정상: 경찰서 1개, 파출소 1개, 분실물 보관 기관 1개, 대사관 1개
- 운영 상태: `OPEN`, `CLOSED`, `UNKNOWN`
- 거리·시간 없음, 전화번호 없음, 길찾기 불가 기관
- 긴 기관명·긴 일본어 주소
- 위치 권한 거부, 지도 미지원, 기관 목록 없음, 조회 오류

완료 기준:

- 모바일·웹이 같은 `NearbyAgenciesViewProps`로 렌더링된다.
- 지도 없이도 선택 카드·목록에서 기관 선택·길찾기·전화 action을 모두 찾을 수 있다.
- 좁은 화면과 긴 주소에서도 두 CTA와 하단 탭이 잘리지 않는다.

---

## 7. 3단계 — S12 Screen·mock·route 연결

현재 완료: `NearbyAgenciesScreen`이 활성 사건 확인, mock 기관 조회, 선택 기관 상태, request ID 기반 늦은 응답 무시, loading·오류·빈 상태를 관리한다. `/case/nearby-agencies` route를 추가하고 S11의 `NEARBY_AGENCIES` action, S12의 `가이드`·`서류` 탭을 연결했다. 실제 위치 권한·지도·전화·길찾기 adapter는 준비 중 안내로 유지한다.

1. `/case/nearby-agencies/index.tsx`는 `NearbyAgenciesScreen`만 렌더링한다.
2. Screen은 활성 사건이 없으면 안전한 빈 상태와 홈 복귀 action을 표시한다.
3. `createMockNearbyAgenciesService()`로 fixture를 조회한다.
4. Screen은 선택 기관 ID만 상태로 보관하고, 기관 목록이 갱신되면 존재하는 선택을 유지하거나 가장 가까운 기관 하나를 선택한다.
5. 현재 위치는 이 단계에서 mock 좌표를 사용한다. 실제 권한 요청은 4단계에서 연결한다.
6. S11은 `NEARBY_AGENCIES` action일 때만 S12로 이동한다.
7. S12의 `가이드` 탭은 S11, `서류` 탭은 S07로 연결한다. `사건` 탭은 별도 사건 홈 route가 확정될 때까지 현재 화면을 유지한다.

상태 처리:

- 중복 기관 조회와 빠른 재시도는 request ID 또는 in-flight ref로 막는다.
- 화면 이탈 뒤 늦게 도착한 목록이 상태를 바꾸지 않도록 mounted·request ID를 검사한다.
- 길찾기·전화 action은 목록 조회와 별도 loading 상태로 둔다.

완료 기준:

- S11 → S12 → S11/S07 이동이 활성 사건을 유지한다.
- mock 정상·빈 목록·오류·긴 텍스트에서 View가 crash하지 않는다.
- route param에 좌표·전화번호·access token을 넣지 않는다.

---

## 8. 4단계 — 위치·지도·길찾기·전화 native adapter

현재 완료: 기존 `expoLocationService`를 S12 위치 계약으로 감싼 실제 위치 권한·현재 위치 adapter를 연결했고, `Linking` 기반 외부 Google Maps 길찾기와 `tel:` 전화 adapter를 구현했다. 권한 거부·위치 실패·외부 앱 미지원은 사용자용 안내로 처리한다. 지도 provider가 아직 확정되지 않아 지도 자체는 접근 가능한 placeholder/fallback으로 유지하며, 실제 지도 SDK 연결은 provider 계약 뒤 진행한다.

지도 SDK와 backend 기관 API 연동은 provider 계약이 확정된 뒤 진행한다. 현재 구현된 device 연동 범위는 위치·외부 길찾기·전화다.

1. 위치 권한 adapter
   - 최초 길찾기 또는 현재 위치 버튼에서만 권한을 요청한다.
   - 거부·재요청 불가 시 수동 위치·기관 목록 fallback을 제공한다.
2. 지도 adapter
   - native 지도는 현재 위치·선택 기관·지도 영역만 렌더링한다.
   - marker 선택은 `agencyId` event로 Screen에 전달한다.
3. 기관 API service
   - 현재 위치 좌표, 허용된 기관 유형과 정렬 기준으로만 서버를 조회한다.
   - API 응답의 거리·운영 상태·전화번호를 검증·정규화한다.
4. directions adapter
   - 선택 기관 좌표·표시명으로 외부 지도 또는 내부 길찾기를 연다.
   - 실패 시 주소 복사·웹 길찾기 fallback을 제공한다.
5. phone adapter
   - `전화하기` 뒤에만 `tel:`을 실행하고, 지원하지 않는 플랫폼에서는 번호 확인·복사 fallback을 제공한다.

완료 기준:

- 위치 권한·지도·전화·외부 지도 실패가 앱 crash로 이어지지 않는다.
- 앱 background·화면 이탈 시 위치 구독과 지도 listener를 해제한다.
- 지도 provider key, 정확한 위치와 기관 전화번호가 앱 로그에 남지 않는다.

---

## 9. 5단계 — 개인정보·접근성·웹 fallback

현재 완료: 위치 사용 목적·저장하지 않는 정보(위치 이력·기관 전화번호)를 화면에 안내하고, 권한 오류에서 기기 설정 fallback을 제공한다. 기관 marker·행·길찾기·전화 CTA에 역할·상태·동작 hint를 추가했으며, 지도 provider가 없어도 기관 목록·선택 카드·외부 길찾기 fallback을 사용할 수 있다. S12는 route param에 위치·전화번호를 넣지 않고 adapter 안에서만 외부 action을 실행한다.

- 정확한 좌표·이동 이력·전화번호를 analytics, 일반 로그, crash message와 route param에 넣지 않는다.
- 위치 권한 전에는 목적을 안내하고, 거부 후에도 수동 위치·목록 fallback을 제공한다.
- 외부 길찾기·전화 실행 전에 앱 밖으로 이동함을 사용자에게 알린다.
- 지도 제어 버튼, marker, 기관 행에는 기관명·유형·운영 상태·거리·예상 시간을 포함한 접근성 label을 제공한다.
- 기관 상태·유형은 색상만으로 전달하지 않는다. 운영 상태 badge는 text를 포함한다.
- 웹에서는 키보드 Tab·Enter·Space로 기관 행·길찾기·전화하기를 실행할 수 있어야 한다.
- 웹 지도 SDK가 없으면 지도 영역의 `지도 미지원` 안내와 선택 카드·목록·외부 길찾기 fallback을 제공한다.
- 모바일·웹은 최대 약 `480px` 폭과 동일한 세로 정보 순서를 유지한다.

---

## 10. 6단계 — 정적 검사와 테스트

현재 완료: S12 선택 기관 유지·가장 가까운 기관 fallback, mock service의 정상·빈 목록·잘못된 좌표·네트워크 오류를 테스트했다. 전체 mobile 자동 테스트 13개와 typecheck, diff 검사를 통과했으며, S12 범위에서 로그·analytics·민감 route param·지도 key 노출 패턴을 검색했다. 실제 위치 권한·외부 지도·전화 앱 동작은 실기기 QA에서 확인한다.

구현 중 각 단계가 끝날 때 실행한다.

```cmd
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

순수 함수 테스트 대상:

- 기관 유형·운영 상태 label과 icon mapping
- 거리·이동 시간의 있음·없음 표시
- 거리순 정렬과 거리 미확인 기관의 마지막 배치
- 기관 목록 갱신 뒤 선택 기관 유지·fallback 선택
- 위치 권한 거부와 directions·phone adapter 오류의 안전한 사용자 문구
- S11 `NEARBY_AGENCIES` action routing

코드 검색 점검:

```cmd
rg -n "console\\.|analytics|latitude|longitude|phoneNumber|tel:" apps\\mobile\\src\\features\\nearby-agencies apps\\mobile\\src\\services\\device
rg -n "router\\.(push|replace)" apps\\mobile\\src\\features\\nearby-agencies
rg -n "Map.*key|apiKey|token|secret" apps\\mobile
```

위치·전화번호·지도 provider 비밀값이 log, route 또는 View 내부 Router 호출에 나타나면 제거하거나 책임 경계를 수정한다.

---

## 11. 7단계 — 실기기·웹 QA 시나리오

### 정상 흐름

1. S11의 인근 기관 찾기 action으로 S12에 진입한다.
2. 현재 위치를 확인하고 가장 가까운 기관이 선택 카드에 표시되는지 확인한다.
3. 지도 marker와 목록 행을 번갈아 선택해 같은 기관으로 동기화되는지 확인한다.
4. `길찾기`에서 외부 지도 또는 정해진 fallback이 열리는지 확인한다.
5. `전화하기`에서 사용자 action 뒤에만 전화 기능 또는 번호 복사가 실행되는지 확인한다.
6. `가이드`·`서류` 탭 이동에서 활성 사건이 유지되는지 확인한다.

### 오류·안전성

- 위치 권한 최초 거부·재요청 불가·정확도 낮음
- 지도 provider 미지원·네트워크 끊김·기관 API timeout
- 주변 기관 없음·운영 시간 미확인·전화번호 없음·길찾기 불가
- 긴 일본어 기관명·주소, 좁은 모바일 화면과 넓은 웹 viewport
- VoiceOver·TalkBack·웹 키보드로 지도 없이 목록 action 실행
- 앱 로그·crash·route에 좌표, 전화번호, 지도 API key가 없는지

---

## 12. 실제 작업 순서 요약

1. typecheck·기준선 확인과 지도·기관 데이터 정책 기록
2. S12 domain type, service interface, S11 `NEARBY_AGENCIES` action 계약 작성
3. 모바일·웹 공통 View와 정적 fixture 구현
4. Screen·mock·route·S11/S07 하단 탭 연결
5. 위치 권한, 지도, 기관 API, 길찾기·전화 adapter 연결
6. 개인정보·접근성·웹 fallback 보완
7. 단위 테스트, typecheck, 정적 검색
8. Android·iOS·웹에서 위치·지도·외부 앱 QA

완료 기준:

- S11 → S12 → 길찾기·전화 또는 S11/S07 복귀 흐름이 활성 사건을 유지하며 동작한다.
- 위치 권한이 없거나 지도 provider가 없어도 기관 목록과 수동 fallback으로 도움 요청을 계속할 수 있다.
- 기관 유형·운영 상태·거리·시간은 검증된 데이터와 명확한 unknown 상태로 표시한다.
- 선택 기관의 지도 marker·목록 행·요약 카드가 같은 `agencyId`로 동기화된다.
- 정확한 위치, 이동 이력, 전화번호와 지도 provider 비밀값이 앱 log·analytics·route에 노출되지 않는다.
