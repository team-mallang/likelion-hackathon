# S10 신고서 스캔 모바일 구현 가이드

이 절은 `docs/USER_FLOW.md`의 S10 정의를 모바일 코드로 옮기는 구현 순서다. S09 경위서 초안과 공통 사건·서류 내비게이션은 이미 존재하는 계약을 재사용하고, S10은 저장된 양식이 없을 때만 진입하는 스캔 fallback으로 구현한다.

목표 흐름:

```text
S09 양식 catalog 조회
  → 일치 양식 없음
  → S10 신고서 스캔
  → 촬영·품질 확인·OCR/문서 분석
  → S09 SCANNED_DOCUMENT 경위서 초안
  → 사용자 검토·수정
```

## S10 구현 전 기준선

이미 구현된 S09 초안 View·service·ActiveCaseContext·하단 내비게이션은 다시 만들지 않는다. S10에서 개인정보가 포함된 이미지나 OCR 원문을 route param에 넣지 않고, 활성 사건 범위의 짧은 scan job 식별자만 사용한다.

### 0단계 — 백엔드·OCR 계약 확정

현재 완료(프론트 범위): OCR/업로드 provider를 연결하지 않은 상태에서 `ScanStatus`, scan job, `SCANNED_DOCUMENT` 결과, 오류 코드와 S10 → S09 간 opaque `scanJobId` navigation state 계약을 추가했다. 이미지 URI·OCR 원문·개인정보는 navigation state와 결과 타입에서 제외했다.

먼저 다음 계약을 백엔드/OCR provider와 확정한다.

- 양식 catalog 조회 결과의 `NO_MATCH` 판정과 S10 진입 조건
- 촬영 이미지 업로드 API, 지원 형식·용량·언어·문서 방향·품질 기준
- OCR/문서 분석 job의 `scanJobId`, 상태(`QUEUED | PROCESSING | SUCCEEDED | FAILED`), 만료 시각
- 추출 필드의 S09 매핑, 필드별 confidence와 필수값 누락 표현
- 원본 이미지·OCR 결과의 암호화·보관·삭제 시점과 재시도 정책
- 분석 성공 뒤 S09 draft 생성 API와 `source: "SCANNED_DOCUMENT"`

계약 전에는 실제 업로드·OCR 호출을 만들지 않고 typed mock과 실패 fallback만 사용한다.

### 1단계 — S10 domain type과 service interface

현재 완료: `DocumentScanService`와 typed mock service, 상태·안전한 오류 문구 display util을 구현했다. mock은 scan job과 빈 `SCANNED_DOCUMENT` 결과만 반환하며, OCR 미연결 상태에는 `ANALYSIS_NOT_CONFIGURED` 오류를 명시한다. 실제 카메라 capture·파일 업로드·OCR 요청은 3~4단계 및 백엔드 계약 후에 연결한다.

권장 구조:

```text
apps/mobile/src/features/document-scan/
  types/documentScan.ts
  services/documentScan.ts
  services/mockDocumentScan.ts
  services/cameraCapture.ts
  utils/documentScanDisplay.ts
```

필수 타입:

```ts
type ScanStatus =
  | "READY"
  | "REQUESTING_PERMISSION"
  | "CAPTURING"
  | "ANALYZING"
  | "SUCCESS"
  | "FAILED";

type ScanSource = "SCANNED_DOCUMENT";

type DocumentScanService = {
  analyze(input: {
    caseId: string;
    scanJobId: string;
    imageUri: string;
  }): Promise<{
    source: ScanSource;
    fields: Array<{ fieldId: string; value: string | null; confidence?: number }>;
  }>;
};
```

오류는 권한 거부·카메라 미지원·품질 부족·문서 미감지·분석 실패·네트워크 오류로 정규화하고 provider 원문을 화면에 노출하지 않는다.

### 2단계 — S10 View 계약과 정적 화면

현재 완료: `DocumentScanViewProps` 공통 계약과 모바일·웹 View를 추가했다. 문서 촬영 가이드, 양식 없음 안내 문구, 문서 분석 안내, 상태별 primary CTA, 오류·재시도, 카메라 미지원 fallback과 `서류` 활성 하단 내비게이션을 정적으로 렌더링한다. 실제 route·Screen·camera/OCR action은 3~4단계에서 연결한다.

`DocumentScanViewProps`에는 `scanStatus`, 카메라 지원 여부, 오류 문구, 촬영 미리보기/가이드 상태와 다음 action을 둔다.

- `onBack`, `onStartScan`, `onCapture`, `onRetry`, `onOpenSettings`
- `onOpenCaseTab`, `onOpenGuideTab`, `onOpenDocumentsTab`
- 성공 후 `onReviewDraft` — 직접 제출이 아닌 S09 초안 검토로 이동

화면 순서는 다음과 같다.

1. 헤더 `분실·도난 신고`, 뒤로가기, `3/6`
2. 제목 `양식이 없으신가요?`
3. 설명 `저장된 양식이 없어 실제 작성하신 신고서를 스캔해 주세요.`
4. 문서 모서리 가이드가 있는 촬영 영역
5. `신고서를 이 영역 안에 맞춰주세요` 안내
6. 보조 카드와 촬영 품질 tip
7. primary `신고서 스캔하기`
8. 하단 `사건·가이드·서류` — `서류` 활성

지도·카메라 SDK를 View에서 직접 호출하지 않고, SDK가 없어도 촬영 안내·파일 업로드·S09 복귀가 보이는 정적 fallback을 제공한다.

### 3단계 — Screen·mock·route·S09 연결

현재 완료: `/case/document-scan` route와 `DocumentScanScreen`을 추가했다. 현재는 OCR 없이 mock scan job을 생성·조회해 `SCANNED_DOCUMENT` source와 opaque `scanJobId`만 S09에 전달한다. S09 mock draft는 해당 source를 표시용으로 보존하며, S09가 draft를 읽은 뒤 navigation state를 정리한다. S09의 실제 `NO_MATCH` catalog 판정과 카메라 capture는 백엔드/OCR 계약 뒤 연결한다.

1. `/case/document-scan` route는 `DocumentScanScreen`만 렌더링한다.
2. S09가 양식 조회에서 `NO_MATCH`를 받은 경우에만 활성 사건을 유지한 채 S10으로 이동한다.
3. `createMockDocumentScanService()`는 성공·누락 필드·저신뢰도·분석 실패 fixture를 제공한다.
4. 촬영 action은 권한 확인 → capture adapter → 분석 mock 순서로 실행한다.
5. 성공 시 이미지 URI를 S10 밖으로 전달하지 않고, 필드 결과와 `SCANNED_DOCUMENT` source만 S09 draft 생성 service에 전달한다.
6. S09 초안 생성이 끝나면 S09 검토 화면으로 이동하며 사용자가 수정·확정할 수 있게 한다.
7. 뒤로가기·하단 탭·unmount 시 카메라 session과 분석 요청을 취소/무효화한다.

### 4단계 — 카메라·문서 분석 adapter와 수명주기

현재 완료(ocr 제외): `expo-image-picker` 기반 capture adapter를 추가했다. native에서는 사용자가 `신고서 스캔하기`를 누른 뒤에만 카메라 권한·촬영 UI를 열고, web에서는 이미지 파일 선택으로 대체한다. 이미지 URI는 현재 OCR 업로드가 없으므로 mock job을 시작한 뒤 즉시 화면 상태·navigation state에 보관하지 않는다. 화면 이탈 시 request generation을 무효화해 늦은 결과를 반영하지 않는다.

- native는 카메라 권한과 촬영 adapter를 사용하고, web은 파일 선택 adapter로 대체한다.
- 화면 진입만으로 카메라를 켜지 말고 `신고서 스캔하기` 클릭 뒤에만 permission을 요청한다.
- capture 중 background·뒤로가기·탭 이동·unmount가 발생하면 camera session을 해제한다.
- 분석 요청에는 취소/요청 세대(`requestId`)를 두어 늦게 도착한 결과가 현재 화면을 덮지 않게 한다.
- 실패·timeout·앱 이탈 뒤에도 원본 이미지 URI와 OCR 원문이 남지 않도록 메모리 상태를 정리한다.

### 5단계 — 개인정보·접근성·웹 fallback

현재 완료: iOS/Android 카메라 사용 목적을 app config에 추가하고, Android의 CAMERA 차단 설정을 해제했다. 권한 거부·촬영 취소·촬영 실패를 안전한 문구로 표시하며, 웹은 파일 선택 fallback과 키보드로 실행 가능한 action을 사용한다. OCR 원문·이미지 URI는 route·analytics·일반 로그에 전달하지 않는다.

- 권한 dialog 전에 촬영·분석 목적, 원본 보관 여부와 삭제 시점을 안내한다.
- 전화번호·주소·얼굴·문서 원문을 일반 로그·analytics·crash message·route에 넣지 않는다.
- 촬영 영역과 문서 marker에는 스크린 리더용 label을 제공하고, 상태는 색상 외에 text로 표시한다.
- `신고서 스캔하기`, `다시 촬영`, `경위서 초안 확인`에 현재 상태와 다음 결과를 accessibility hint로 제공한다.
- 웹에서 카메라를 사용할 수 없으면 `<input type="file">` 기반 업로드와 주소/파일 오류 fallback을 제공한다.
- 좁은 화면에서 문서명·오류·추출 필드가 잘리지 않도록 최대 480px 세로 layout을 유지한다.

### 6단계 — 정적 검사와 테스트

현재 완료: S10 mock scan job·`SCANNED_DOCUMENT` source·OCR 미연결 오류·capture/analysis 상태 문구·S10 → S09 opaque navigation state clear를 자동 테스트에 등록했다. `test`, `typecheck`, `git diff --check`와 민감정보·route·지도 key 검색을 수행한다.

```cmd
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

테스트 대상:

- 양식 catalog `NO_MATCH`일 때 S10 진입, 양식이 있으면 S09 유지
- scan status와 오류 문구 mapping
- mock 분석 성공·필수 필드 누락·저신뢰도·실패
- 중복 촬영/중복 분석 방지와 늦은 응답 무시
- 화면 이탈·background 뒤 camera/analysis cleanup
- 성공 결과가 `SCANNED_DOCUMENT` source로 S09에 전달되는지
- 웹 파일 업로드 fallback과 S09 복귀 action

민감정보 검색 점검:

```cmd
rg -n "console\\.|analytics|imageUri|ocr|phone|address" apps\\mobile\\src\\features\\document-scan
rg -n "router\\.(push|replace)" apps\\mobile\\src\\features\\document-scan
```

---

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
