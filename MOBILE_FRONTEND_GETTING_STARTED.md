# S15 신고서 사진 등록 모바일 구현 가이드

이 문서는 `docs/USER_FLOW.md`에 정의된 S15 신고서 사진 등록 화면을 구현하는 순서다. S10 OCR 스캔과 S13 길찾기처럼 이미 완료된 가이드는 반복하지 않는다.

S15의 목적은 사용자가 실제로 작성·접수한 신고서를 촬영하거나 기기에서 선택한 뒤, 내용을 확인하고 OS의 사진·파일·공유 기능으로 직접 보관하도록 돕는 것이다. 앱 서버, AI 분석 저장소에 자동 업로드하거나 앱이 영구 보관하지 않는다.

목표 흐름:

```text
S09 실제 신고서 저장하기 / S07 신고서 사진 없음
  → S15 신고서 사진 등록
  → 사진 촬영 또는 갤러리·파일 선택
  → 미리보기·개인정보 확인
  → 기기에 저장/공유
  → 진입 출처(S09 또는 S07)로 복귀
```

## 시작 전 기준선

```cmd
git status --short
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

재사용할 기반:

- `ActiveCaseContext`와 공통 사건·가이드·서류 하단 내비게이션
- 기존 `expo-image-picker` 카메라 권한·웹 파일 선택 adapter의 오류 처리 패턴
- S10의 화면 이탈 시 요청 세대 무효화와 민감정보 비보관 원칙
- S09 `/case/report`, S07 `/case/documents` route

## 0단계 — 저장·공유 정책과 수명주기 계약

현재 완료: S09/S07 entry point, session-only preview, OS 저장/공유 handoff, 취소·실패·background·unmount cleanup의 프론트 계약을 확정했다. 앱 서버·AI 저장소 자동 업로드와 영구 보관은 계약 범위에서 제외했다.

코드보다 먼저 다음 정책을 확정한다.

- S09 `실제 신고서 저장하기`와 S07 `신고서 사진 등록`의 정확한 진입 조건·label
- S15 진입 출처: `S09_REPORT_DRAFT | S07_DOCUMENTS`
- 카메라·갤러리·웹 파일 선택의 지원 형식, 최대 크기, 해상도와 손상 파일 기준
- iOS·Android·웹에서 OS 사진/파일 저장·공유 결과를 판단하는 범위
- 저장/공유 성공·취소·실패 시 S07의 사진 등록 상태를 갱신할지 여부
- 앱 임시 파일의 위치·만료·삭제 시점. OS 갤러리에 사용자가 저장한 원본은 삭제하지 않는다.
- 복수 페이지 신고서의 최대 장수·순서·PDF 변환 제공 여부

확정 전에는 서버 업로드, AI 분석, 자동 암호화 보관을 구현하지 않는다. route param에는 사건 상세·사진 URI·base64를 넣지 않는다.

## 1단계 — S15 domain type과 service interface

현재 완료: `report-photo/types`, capture/export service interface, 오류 코드, entry point만 전달하는 navigation state, 상태·오류 display util과 stage-1 mock을 추가했다. mock export는 실제 저장을 수행하지 않고 `EXPORT_NOT_SUPPORTED`를 반환한다.

권장 구조:

```text
apps/mobile/src/features/report-photo/
  types/reportPhoto.ts
  services/reportPhotoCapture.ts
  services/reportPhotoExport.ts
  services/mockReportPhoto.ts
  utils/reportPhotoDisplay.ts
```

핵심 타입:

```ts
type ReportPhotoEntryPoint = "S09_REPORT_DRAFT" | "S07_DOCUMENTS";

type ReportPhotoStatus =
  | "READY"
  | "REQUESTING_PERMISSION"
  | "CAPTURING"
  | "SELECTING"
  | "PREVIEW"
  | "EXPORTING"
  | "COMPLETED"
  | "FAILED";

type ReportPhotoSession = {
  entryPoint: ReportPhotoEntryPoint;
  status: ReportPhotoStatus;
  previewAvailable: boolean;
  mimeType?: string;
};

type ReportPhotoCaptureService = {
  capture(): Promise<{ uri: string; mimeType?: string }>;
  select(): Promise<{ uri: string; mimeType?: string }>;
};

type ReportPhotoExportService = {
  saveOrShare(input: { uri: string; mimeType?: string }): Promise<
    "COMPLETED" | "CANCELLED"
  >;
};
```

`uri`는 현재 화면 session에서만 사용한다. navigation state와 analytics에는 `entryPoint`와 상태만 전달한다. capture/export provider 원문 오류는 권한 거부·지원 형식·저장 실패 등 안전한 오류 코드로 바꾼다.

## 2단계 — View 계약과 정적 화면

현재 완료: `ReportPhotoViewProps`와 모바일·웹 View를 추가했다. 촬영 guide frame, progress, preview 상태, `사진 촬영`, `갤러리에서 선택`, 개인정보 저장 안내, `기기에 저장/공유`, 다시 선택, 실패/완료 상태와 `서류` 활성 하단 내비게이션을 정적으로 렌더링한다. 실제 route와 adapter 연결은 다음 단계에서 진행한다.

`ReportPhotoViewProps`에는 다음을 둔다.

- `entryPoint`, `captureStatus`, `isCameraSupported`, `isFileSelectionSupported`
- 현재 preview 표시 여부와 안전한 오류 문구
- `onBack`, `onCapture`, `onSelectFile`, `onRetry`, `onExport`, `onDiscard`
- `onCaseTab`, `onGuideTab`, `onDocumentsTab`

화면 순서:

1. 헤더: 뒤로가기, 중앙 `신고서 사진 등록`
2. 선형 progress: 촬영 준비·미리보기·저장 확인 상태. 확정되지 않은 `3/6` 숫자는 표시하지 않는다.
3. 문서 전체가 들어오는 세로형 guide frame
   - 촬영 전: `신고서 전체가 잘 보이도록 촬영해 주세요.`
   - 촬영 후: session preview와 `사진을 확인해 주세요.`
4. 입력 action
   - primary `사진 촬영`
   - secondary `갤러리에서 선택` 또는 웹 `파일에서 선택`
5. 안내 카드
   - 제목 `사진 저장 안내`
   - `촬영하거나 선택한 신고서 사진은 앱 서버에 저장되지 않습니다. 내용을 확인한 뒤 기기의 사진 또는 파일 저장 기능을 이용해 직접 보관해 주세요.`
6. preview 이후 `기기에 저장/공유`, `다시 촬영` 또는 `다른 사진 선택`
7. 하단 `사건·가이드·서류`, `서류` 활성

View는 카메라, picker, filesystem, share sheet, router를 직접 호출하지 않는다. native와 web은 같은 props로 지도/카메라 미지원·오류 상태까지 렌더링한다.

## 3단계 — Screen·route·S09/S07 연결

현재 완료: `/case/report-photo` route와 `ReportPhotoScreen`을 추가하고 S09 저장 action·S07 사진 없음 evidence action을 entry point 기반 in-memory state로 연결했다. 현재 Screen은 mock capture로 PREVIEW까지 이동하며 mock export는 미연결 오류를 반환한다. 뒤로가기·하단 탭·unmount 시 session photo와 navigation state를 정리한다.

1. `/case/report-photo` route는 `ReportPhotoScreen`만 렌더링한다.
2. S09 `실제 신고서 저장하기`와 S07 사진 없음 action에서 `entryPoint`만 짧은 in-memory navigation state로 전달한다.
3. Screen은 `READY → CAPTURING/SELECTING → PREVIEW → EXPORTING → COMPLETED` 상태를 소유한다.
4. `onBack`, 하단 탭, background, unmount 시 camera/picker session과 임시 preview를 정리한다.
5. `기기에 저장/공유`가 OS handoff를 시작한 뒤에만 `COMPLETED`를 표시한다. 결과를 알 수 없으면 자동 완료로 처리하지 않는다.
6. 완료 또는 취소 후 entry point에 따라 S09 또는 S07로 복귀한다. 앱이 자체 저장했다는 문구를 표시하지 않는다.
7. 진입 출처가 없거나 사건이 없으면 안전한 빈 상태와 S07/S09 복귀 action을 표시한다.

## 4단계 — native capture·web file·export adapter

현재 완료: `expo-image-picker` 기반 native 카메라 권한/촬영과 web·native 갤러리 선택 adapter, MIME·20MB 검증, React Native `Share` 기반 OS 저장·공유 adapter를 연결했다. Screen은 이제 mock이 아닌 플랫폼 adapter를 사용하며 취소·권한 거부·미지원·실패를 계약 오류로 변환한다.

- native `expo-image-picker` 카메라는 `사진 촬영`을 누른 뒤에만 권한을 요청한다.
- web은 카메라를 강제하지 않고 `<input type="file" accept="image/*">` 또는 동일 기능의 picker를 제공한다.
- 선택 직후 MIME type·용량·손상 여부를 검증하고 preview에서 사용자가 확인하게 한다.
- OS 저장/공유 adapter는 iOS·Android·web의 실제 기능 범위를 감싼다. provider가 지원하지 않으면 주소/파일 저장 안내와 재시도만 제공한다.
- 임시 URI를 직접 서버로 보내지 않는다. 현재 정책에서는 capture 후 export adapter에만 전달하고, 완료·취소·실패·background·unmount 때 참조를 폐기한다.
- 복수 페이지와 PDF 변환은 정책 확정 전 단일 이미지 흐름으로 제한하고 사용자에게 명확히 알린다.

## 5단계 — 개인정보·접근성·안전성

현재 완료: 사진 URI는 Screen의 세션 메모리에만 보관하고 route·로그·analytics로 전달하지 않는다. preview에는 선택된 사진을 직접 확인할 수 있게 하되 화면 종료·unmount 시 참조를 정리한다. 카메라 미지원 웹에서는 파일 선택 fallback을 제공하고, 버튼 label·hint·role·busy/disabled·alert·탭 selected 상태를 View에 적용했다.

- 카메라 권한 전에 신고서에 이름·주소·연락처·사건번호가 포함될 수 있음을 알리고 촬영 목적을 설명한다.
- 앱 서버 저장, AI 추출, 보험사 자동 전송, 암호화 영구 보관을 제공한다고 표현하지 않는다.
- 이미지 URI·base64·OCR 원문·개인정보를 일반 로그, analytics, crash message, route param에 남기지 않는다.
- OS 저장/공유 화면으로 이동하는 순간 외부 앱·기기 저장소로 전달될 수 있음을 표시한다.
- 촬영 frame, 사진 촬영, 갤러리 선택, 다시 촬영, 저장/공유는 text label·accessibility hint·busy/disabled 상태를 제공한다.
- 스크린 리더 사용자는 preview 없이도 현재 상태와 다음 action을 이해할 수 있어야 한다.
- 웹 키보드로 파일 선택·재선택·저장/공유를 실행하고, 480px 내 세로 정보 순서를 유지한다.

## 6단계 — 정적 검사와 테스트

현재 완료: typecheck·diff 검사와 모바일 전체 테스트 29개를 통과했다. S15 mock 계약·entry point·export 미연결 오류 및 기존 S09/S10/S12/S13/S14 회귀 테스트를 함께 확인했다.

```cmd
pnpm.cmd --filter mobile test
pnpm.cmd --filter mobile typecheck
git diff --check
```

테스트 대상:

- S09/S07 entry point가 올바르게 전달되고 민감한 route 값이 없는지
- `READY`, 권한 거부, 촬영/선택 중, preview, export, completed, failed 상태 label
- 지원하지 않는 MIME type·크기 초과·취소·저장 실패의 안전한 메시지
- 중복 촬영·중복 export 방지
- 화면 이탈·background·unmount 뒤 camera/picker/임시 URI cleanup
- OS export가 `COMPLETED`를 반환하기 전 완료 상태로 바뀌지 않는지
- 웹 파일 선택 fallback과 S09/S07 복귀 action

검색 점검:

```cmd
rg -n "console\\.|analytics|base64|imageUri|ocr|upload|accessToken" apps\\mobile\\src\\features\\report-photo
rg -n "router\\.(push|replace)" apps\\mobile\\src\\features\\report-photo
rg -n "apiKey|secret|Map.*key" apps\\mobile\\src\\features\\report-photo apps\\mobile\\app.json
```

## 7단계 — 실기기·웹 QA

1. S09에서 `실제 신고서 저장하기`로 S15에 진입한다.
2. S07에 사진이 없을 때 같은 화면으로 진입하는지 확인한다.
3. native 카메라 권한 허용·거부·취소, 갤러리 선택을 확인한다.
4. 웹 파일 선택, 잘못된 형식, 취소, 키보드 조작을 확인한다.
5. preview에서 신고서 전체가 보이고 개인정보 저장 안내가 표시되는지 확인한다.
6. OS 저장/공유를 완료하기 전 `COMPLETED`가 표시되지 않는지 확인한다.
7. 저장/공유 취소·실패 후 재시도와 S09/S07 복귀를 확인한다.
8. background·뒤로가기·하단 탭 이동 후 카메라·picker·임시 URI가 남지 않는지 확인한다.

완료 기준:

- S09와 S07에서 S15로 진입하고 올바른 entry point로 복귀한다.
- 사진은 사용자 확인 후 OS 저장/공유로만 전달되며 앱 서버·AI 저장소에 자동 전송되지 않는다.
- native·web에서 카메라 미지원·권한 거부·저장 실패 fallback을 사용할 수 있다.
- 테스트·typecheck·diff 검사와 실기기·웹 QA를 통과한다.
