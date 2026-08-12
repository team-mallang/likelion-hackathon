# S13 길찾기 모바일 구현 가이드

이 문서는 `docs/USER_FLOW.md`에 확정된 S13 길찾기 화면을 현재 모바일 코드 구조에 맞춰 구현하는 순서다.

완료된 S12 구현 상세는 이 문서에서 제거했다. S12의 기관 선택과 S14의 경찰서 실시간 대응은 이미 존재하는 진입·목적 화면으로 사용하며, UI·문구·상태의 최종 기준은 항상 `docs/USER_FLOW.md`다.

---

## 1. 목표와 완성 흐름

S13은 S12에서 선택한 기관으로의 이동을 안내하고, 사용자가 도착을 확인하면 S14를 연다.

```text
S12 선택 기관의 `길찾기`
  → S13 목적지·경로 확인
  → `경로 안내 시작`
  → `도착했어요`
  → 경로·위치 구독 정리
  → S14 경찰 지원
```

이번 구현 범위:

- `/case/directions` route, Screen, 모바일·웹 공통 View와 View props
- S12 선택 기관의 `agencyId`를 활성 사건 범위 안에서 전달·조회하는 경계
- 지도 영역, 목적지 요약, 이동 수단 선택, 경로 상태별 CTA 정적 UI
- `READY → NAVIGATING → ARRIVED` 상태와 위치·경로·오류 mock
- S12 → S13, S13 → S14 및 하단 탭 연결
- 실제 위치 구독·지도·경로 service의 시작·정지·background cleanup 경계
- 개인정보·접근성·웹 fallback·정적 테스트

정책 확정 전 구현하지 않는 것:

- 위치 이력 또는 경로 polyline의 장기 저장·analytics 전송
- 도착을 자동으로 판정해 S14를 임의로 여는 동작
- 지도 provider 정확도·대중교통 시간·비용이 확인되지 않은 실제 경로 데이터
- 앱 밖에서 음성 내비게이션이나 TTS를 자동 재생하는 동작
- route param에 좌표·전화번호·access token·사건 상세를 직접 포함하는 동작

---

## 2. 시작 전 기준선과 백엔드 결정

```cmd
git status --short
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

이미 존재하는 기반:

- S12 `/case/nearby-agencies`, `NearbyAgency`, 위치·외부 길찾기·전화 adapter
- S14 `/case/police-support`, `PoliceSupportScreen`
- `ActiveCaseContext`, `CaseBottomNavigation`, 공통 View 구조와 디자인 토큰
- S12에서 기관을 `agencyId`로 선택하는 상태

아래 항목은 백엔드·지도 provider·기획 계약에서 확정한다. 프론트는 임의로 정하지 않고, 확정 전에는 mock과 fallback만 사용한다.

1. S13 route 이름
   - 제안: `/case/directions`
2. S12 → S13 선택 기관 전달 방식
   - route param 대신 활성 사건 범위의 임시 navigation state 또는 재조회 가능한 `agencyId`만 사용한다.
3. 지도·경로 provider
   - 지도 타일, 도보·대중교통·차량 경로, 예상 시간과 provider key 관리 방식을 확정한다.
4. 위치 갱신·도착 정책
   - foreground/background 갱신 범위, 갱신 주기, 도착 자동 판정 사용 여부와 배터리 기준을 확정한다.
5. S14 이동 정책
   - `도착했어요` 클릭 뒤 위치 구독·경로 작업 종료가 성공했을 때 S14를 여는 순서를 확정한다.

---

## 3. 공통 책임과 feature 구조

```text
route: Screen만 렌더링
Screen: Router, ActiveCase, 선택 기관, service, 경로 수명주기
View: props 렌더링과 사용자 이벤트 전달
service: 경로 API·mock 응답 정규화
device adapter: 위치 권한·위치 구독·지도·외부 길찾기
```

View에서 Router, Context, 지도 SDK, 위치 SDK, `Linking` 또는 경로 API를 직접 호출하지 않는다.

권장 구조:

```text
apps/mobile/app/case/directions/index.tsx

apps/mobile/src/features/directions/
  screens/DirectionsScreen.tsx
  services/directions.ts
  services/mockDirections.ts
  services/locationTracking.ts
  types/directions.ts
  utils/directionDisplay.ts
  views/DirectionsView.tsx
  views/DirectionsView.web.tsx
  views/DirectionsView.types.ts
  components/DirectionsMap.tsx
  components/DestinationCard.tsx
  components/TravelModeSelector.tsx
```

S13의 device adapter는 S12의 위치·외부 길찾기 adapter를 재사용하거나, 위치 구독처럼 새로운 책임만 분리한다. 같은 권한·`Linking` 코드를 복제하지 않는다.

---

## 4. 0단계 — S13 데이터·수명주기 계약

현재 완료: S13 경로·목적지·이동 수단·상태와 query 타입을 `features/directions/types/directions.ts`에 정의했다. `services/directions.ts`에는 경로 조회 interface와 오류 코드, `services/locationTracking.ts`에는 시작·정지 가능한 위치 추적 interface와 오류 코드, `services/directionsNavigation.ts`에는 S12 → S13 최소 `agencyId` navigation state 계약을 추가했다. 실제 provider·store·mock·route는 이후 단계에서 구현한다.

### 4.1 경로 조회 계약

```ts
type RouteStatus = "READY" | "NAVIGATING" | "ARRIVED" | "FAILED";
type TravelMode = "WALK" | "TRANSIT" | "DRIVE";

type RouteGuidance = {
  agencyId: string;
  travelMode: TravelMode;
  distanceMeters?: number;
  durationMinutes?: number;
  routeStatus: RouteStatus;
  origin: DeviceLocation | null;
  destination: { latitude: number; longitude: number };
  polyline?: string;
  updatedAt: string;
};

type DirectionsQuery = {
  caseId: string;
  accessToken?: string;
  agencyId: string;
  travelMode: TravelMode;
  origin: DeviceLocation;
};

type DirectionsService = {
  getRoute(query: DirectionsQuery): Promise<RouteGuidance>;
};
```

계약 원칙:

- 서버·provider가 반환한 거리·시간만 표시하며, 미확인은 `거리 확인 불가`·`시간 확인 불가`로 표시한다.
- `agencyId`와 이동 수단은 서버가 허용한 기관·수단인지 검증한다.
- 정확한 origin·polyline은 화면 수명주기 동안에만 유지하고 로그·route param에 넣지 않는다.

### 4.2 위치 추적 계약

```ts
type LocationTrackingService = {
  start(listener: (location: DeviceLocation) => void): Promise<() => void>;
};
```

- `start`는 `NAVIGATING` 상태일 때만 호출한다.
- 반환된 unsubscribe는 도착 확인, 뒤로가기, 하단 탭, background, unmount와 S14 이동 전에 반드시 호출한다.
- 권한 거부·위치 서비스 비활성·추적 실패는 안전한 사용자 메시지로 치환한다.

### 4.3 S12·S14 연결 계약

- S12는 선택 기관의 `agencyId`만 S13에 전달한다. 좌표·전화번호·access token은 Screen/service가 활성 사건·기관 데이터에서 조회한다.
- S13 `도착했어요`는 `routeStatus`를 `ARRIVED`로 바꾸고, 위치 추적·경로 작업을 정리한 뒤 S14로 이동한다.
- S14 이동 실패 시 S13을 유지하고 `경찰 지원 시작` 재시도를 제공한다.

0단계 완료 기준:

- 경로·위치 추적·목적지·수명주기 타입과 오류 코드가 문서·type 파일에서 일치한다.
- S12 → S13 → S14에 개인정보가 포함된 route param이 없다.
- 실제 provider가 없어도 mock service와 mock tracking adapter가 같은 타입을 반환한다.

---

## 5. 1단계 — domain type과 service interface

현재 완료: 0단계의 경로·위치 추적·navigation 타입 및 `DirectionsService` 오류 경계를 유지하고, `features/directions/utils/directionDisplay.ts`에 이동 수단 표시, 경로 상태 CTA·접근성 문구, 거리·시간 formatter, 지원 수단 fallback을 추가했다. 같은 규칙의 단위 테스트도 등록했다.

`features/directions/types/directions.ts`에 `RouteStatus`, `RouteGuidance`, 목적지 요약·이동 수단 타입을 정의한다.

`services/directions.ts`에는 아래 오류 경계를 둔다.

```ts
type DirectionsServiceErrorCode =
  | "INVALID_CASE_ID"
  | "DESTINATION_NOT_FOUND"
  | "LOCATION_REQUIRED"
  | "ROUTE_NOT_FOUND"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";
```

순수 함수로 분리할 항목:

- 이동 수단별 label·icon mapping
- 거리·시간 formatter
- `READY`, `NAVIGATING`, `ARRIVED` CTA label과 접근성 label
- 현재 선택 수단이 제공되지 않을 때 안전한 fallback 수단 선택

완료 기준:

- 이동 수단·경로 상태가 색상만 없이 text로 표시될 수 있다.
- 거리·시간·경로가 없는 상태가 성공 경로처럼 보이지 않는다.
- `pnpm.cmd --filter mobile typecheck` 통과

---

## 6. 2단계 — S13 View 계약과 정적 화면

현재 완료: `DirectionsViewProps` 공통 계약과 모바일·웹 View를 추가했다. 정적 지도 fallback, 목적지 요약 카드, 이동 수단 radio selector, 경로 상태별 CTA와 하단 내비게이션을 구현했다. `READY`, `NAVIGATING`, `ARRIVED`, 거리·시간 미확인 상태를 위한 fixture도 추가했다. route·Screen·S12/S14 action 연결은 3단계에서 진행한다.

### 6.1 `DirectionsViewProps`

```ts
type DirectionsViewProps = {
  destination: NearbyAgency | null;
  guidance: RouteGuidance | null;
  availableTravelModes: TravelMode[];
  isLoadingRoute: boolean;
  isTrackingLocation: boolean;
  errorMessage: string | null;
  mapStatus: "READY" | "LOADING" | "UNAVAILABLE";
  onBack: () => void;
  onSelectTravelMode: (mode: TravelMode) => void;
  onStartGuidance: () => void;
  onConfirmArrival: () => void;
  onRetryRoute: () => void;
  onOpenExternalDirections: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
```

### 6.2 화면 순서

1. 헤더: 뒤로가기, `길찾기`, 연결 상태 icon·text
2. 지도 또는 지도 fallback: 현재 위치·목적지 marker·경로 polyline
3. 목적지 카드: 기관명, 거리·예상 시간
4. 이동 수단 selector: `도보`, `대중교통`, `차량`
5. 경로 설명 안내
6. 상태별 primary CTA
   - `READY`: `경로 안내 시작`
   - `NAVIGATING`: `도착했어요`
   - `ARRIVED`: `경찰 지원 시작`
7. 하단 `사건`, `가이드`, `서류` 내비게이션 — `가이드` 활성

### 6.3 정적 fixture

- 정상 도보 경로, 대중교통·차량 경로
- 거리·시간·polyline 없음
- 긴 일본어 기관명·주소
- 위치 권한 거부, 경로 조회 실패, 지도 미지원, S14 이동 실패
- `READY`, `NAVIGATING`, `ARRIVED` CTA 상태

완료 기준:

- 모바일·웹이 동일 View props로 모든 경로 상태를 렌더링한다.
- 지도 없이도 목적지·이동 수단·경로 시작·S14 이동을 사용할 수 있다.
- 하단 탭과 긴 기관명·주소·CTA가 좁은 화면에서 잘리지 않는다.

---

## 7. 3단계 — Screen·mock·route·S12/S14 연결

현재 완료: `/case/directions` route와 `DirectionsScreen`을 연결하고, mock 경로 조회·mock 위치 추적·S12의 `agencyId` navigation state를 적용했다. 이동 수단 변경 시 경로를 다시 조회하고, 안내 시작 시 위치 추적을 시작하며, `도착했어요`·뒤로가기·하단 탭 이동 시 추적을 정리한다. 실제 지도·위치 provider와 백엔드 경로 API는 이후 단계에서 교체한다.

1. `/case/directions/index.tsx`는 `DirectionsScreen`만 렌더링한다.
2. Screen은 활성 사건이 없으면 안전한 빈 상태를 표시한다.
3. S12에서 선택한 `agencyId`를 활성 사건 범위의 navigation state로 읽고, 없거나 유효하지 않으면 S12로 복귀할 수 있는 오류 상태를 제공한다.
4. `createMockDirectionsService()`는 목적지·이동 수단별 route fixture를 반환한다.
5. 이동 수단을 바꾸면 진행 중 추적을 먼저 정리하고 새 경로를 조회한다.
6. `경로 안내 시작`은 mock tracking을 시작하고 `NAVIGATING`으로 전환한다.
7. `도착했어요`는 tracking cleanup 완료 뒤 S14 `/case/police-support`로 이동한다.
8. `가이드`·`서류` 탭과 뒤로가기에서도 tracking cleanup 후 이동한다.

완료 기준:

- S12 → S13 → S14가 같은 활성 사건을 유지한다.
- 중복 경로 조회·중복 tracking 시작·중복 S14 이동이 발생하지 않는다.
- 화면 이탈 후 늦게 도착한 경로·위치 응답이 현재 화면을 덮지 않는다.

---

## 8. 4단계 — 실제 위치·지도·경로 adapter와 수명주기

현재 완료: `createExpoLocationTrackingService`가 foreground 위치 권한·위치 서비스 상태를 확인하고 `watchPositionAsync` 구독/해제를 제공한다. S13은 안내 시작 때만 구독하고, 도착·뒤로가기·하단 탭·unmount·background 전환 때 best-effort cleanup한다. 지도 SDK가 확정되기 전에는 `createDirectionsMapProvider`가 `UNAVAILABLE`을 반환해 목적지 카드·외부 지도 fallback을 유지한다. 실제 경로 API는 `DirectionsService` 계약 뒤에 교체한다.

1. S12 위치 권한 service를 재사용해 foreground 위치 권한을 확인한다.
2. `NAVIGATING` 시작 시에만 위치 추적을 구독한다.
3. 지도 provider adapter는 현재 위치·목적지·polyline만 렌더링하고 marker·polyline event를 Screen으로 보낸다.
4. 경로 API service는 현재 위치, `agencyId`, 이동 수단으로 경로를 요청하고 provider 원문 오류를 안전한 코드로 정규화한다.
5. 다음 모든 경우 listener 해제 → 경로 작업 취소/무효화 → 상태 갱신 순서로 cleanup한다.
   - `도착했어요`, 뒤로가기, 하단 탭, 이동 수단 변경, 앱 background, unmount, S14 이동
6. cleanup이 실패해도 S14 이동을 영구 차단하지 않으며, best-effort 정리와 짧은 사용자 안내를 제공한다.

완료 기준:

- background·화면 이탈·네트워크 단절 뒤 위치 구독이 남지 않는다.
- 위치·polyline·지도 provider key가 로그·route·View props 외부에 노출되지 않는다.
- S14 진입 시 S13의 경로 안내가 완전히 종료된다.

---

## 9. 5단계 — 개인정보·접근성·웹 fallback

현재 완료: 위치 사용 목적·보관하지 않는 데이터 범위를 View에 명시하고, 지도 미지원 웹에서도 목적지 카드·외부 지도·S14 CTA를 유지한다. 이동 수단 radio, 지도 marker·목적지·CTA의 텍스트 접근성 label과 최대 480px 세로 layout을 적용했다.

- 위치 사용 목적과 경로 안내 중 위치가 갱신된다는 점을 시작 전에 안내한다.
- 이동 이력·polyline·좌표를 analytics, 일반 로그, crash message와 route param에 넣지 않는다.
- 이동 수단 selector는 radio role·선택 상태·label을 제공한다.
- `경로 안내 시작`, `도착했어요`, `경찰 지원 시작`은 현재 상태와 다음 결과를 접근성 hint로 제공한다.
- 지도 marker·현재 위치·목적지에는 이름·기관 유형·거리·예상 시간을 포함한 접근성 label을 제공한다.
- 웹에서 native 지도·위치 추적이 지원되지 않으면 목적지 카드·목록 정보·외부 지도 링크·S14 이동 CTA를 유지한다.
- 모바일·웹은 최대 약 `480px` 폭과 같은 세로 정보 순서를 유지한다.

---

## 10. 6단계 — 정적 검사와 테스트

현재 완료: S13 display mapping, 수단 fallback, mock 위치 callback·stop cleanup, S12 → S13 navigation state clear를 자동 테스트에 포함했다. 전체 test·typecheck·diff 검사를 완료한다.

```cmd
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

순수 함수 테스트 대상:

- 이동 수단·경로 상태의 label과 CTA mapping
- 거리·시간 formatter와 수단 fallback
- S12 기관 선택이 없는 경우의 안전한 S12 복귀 상태
- 동일 목적지의 중복 tracking 시작 방지
- `NAVIGATING → ARRIVED` 전환 뒤 listener cleanup
- 늦은 위치·경로 응답 무시
- S12 → S13, S13 → S14 action routing

코드 검색 점검:

```cmd
rg -n "console\\.|analytics|latitude|longitude|polyline|accessToken" apps\\mobile\\src\\features\\directions
rg -n "router\\.(push|replace)" apps\\mobile\\src\\features\\directions
rg -n "apiKey|secret|Map.*key" apps\\mobile
```

---

## 11. 7단계 — 실기기·웹 QA

1. S12에서 경찰서를 선택하고 `길찾기`로 S13에 진입한다.
2. 기관명·거리·도보 시간이 S12 선택과 일치하는지 확인한다.
3. `경로 안내 시작` 뒤 CTA가 `도착했어요`로 바뀌는지 확인한다.
4. `도착했어요`를 누르면 위치 추적이 정리되고 S14가 열리는지 확인한다.
5. 뒤로가기·하단 탭·앱 background·네트워크 단절에서 tracking이 정리되는지 확인한다.
6. 위치 권한 거부·지도 미지원·경로 오류에서도 외부 지도·S12 복귀·S14 fallback이 유지되는지 확인한다.
7. VoiceOver·TalkBack·웹 키보드로 지도 없이 이동 수단과 CTA를 실행하는지 확인한다.

---

## 12. 실제 작업 순서 요약

1. S13 경로·위치 추적·S12/S14 수명주기 계약 확정
2. domain type·service interface·display utils 작성
3. 모바일·웹 공통 View와 모든 static 상태 구현
4. Screen·mock·route와 S12/S14 연결
5. 실제 위치 추적·지도·경로 provider·cleanup 연결
6. 개인정보·접근성·웹 fallback 보완
7. 단위 테스트·정적 검사·실기기 QA

완료 기준:

- S12에서 선택한 기관으로 S13을 열고, `도착했어요`에서 경로를 정리한 뒤 S14를 연다.
- 경로 안내 중 이탈·background·오류에서 위치 추적·경로 작업이 남지 않는다.
- 지도·위치 provider가 없어도 목적지 정보와 S12/S14 fallback을 사용할 수 있다.
- 위치·경로 데이터·지도 비밀값이 log·analytics·route에 노출되지 않는다.
