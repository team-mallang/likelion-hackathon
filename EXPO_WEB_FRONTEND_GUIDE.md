# Expo Web S01~S05 화면 전용 작업 가이드

이 문서는 저장소를 처음 내려받은 뒤, 준비된 기능과 데이터 계약을 사용해 **웹에서 보이는 S01~S05 화면만** 만드는 순서를 설명합니다.

명령어는 Windows PowerShell 기준입니다. 명령어를 한 줄씩 실행하고 결과를 확인한 다음 다음 단계로 이동합니다.

---

## 0. 담당 범위

이번 작업에서 구현하는 것은 Expo Web의 화면입니다.

```text
S01 홈
  → S02 음성 입력
  → S03 녹음 내용 확인
  → S04 추가 질문
  → S05 사건 카드 내용 확정
```

담당 파일은 이름이 `.web.tsx`로 끝나는 웹 전용 View입니다.

```text
HomeView.web.tsx
VoiceInputView.web.tsx
ReviewView.web.tsx
QuestionsView.web.tsx
ConfirmationView.web.tsx
```

이 파일은 브라우저에서만 사용됩니다. Android와 iOS는 같은 위치의 기본 `.tsx` View 파일을 사용합니다.

### 이번 작업에서 하는 일

- 준비된 글자와 데이터를 화면에 배치
- 웹 화면의 색상, 크기, 간격, 정렬 적용
- 모바일 브라우저와 데스크톱 브라우저의 반응형 배치
- 버튼, 입력창, 카드, 안내문 등의 웹 UI 작성
- hover, focus, 키보드 Tab 이동 같은 브라우저 사용성 처리
- 전달받은 이벤트 함수를 버튼과 입력창에 연결
- 로딩, 오류, 빈 상태, 완료 상태를 전달받은 값에 따라 표시
- S01부터 S05까지 브라우저 화면 확인
- TypeScript 검사, 커밋, Push, Pull Request 생성

### 이번 작업에서 하지 않는 일

- Android·iOS 화면과 스타일 작성
- 마이크 권한 요청과 실제 녹음
- 위치 권한 요청과 현재 위치 조회
- AI 분석
- API 요청과 응답 처리
- Expo 기기 라이브러리 연결
- Context, 전역 상태, 데이터 저장 로직 수정
- Expo Router 경로와 화면 이동 로직 작성
- 사건 데이터의 TypeScript 타입 변경
- `apps/web` Next.js 프로젝트 수정

기능과 앱 화면은 별도 담당자가 구현합니다. 웹 View는 전달받은 데이터와 함수를 화면에서 사용하기만 합니다.

---

## 1. 파일이 나뉘는 방식

한 화면은 다음 세 부분으로 나뉩니다.

```text
Screen 또는 Controller
  ├─ 데이터와 기능 준비
  ├─ 화면 이동
  └─ View에 props 전달
             │
             ├─ SomethingView.tsx         Android·iOS 기본 화면
             └─ SomethingView.web.tsx     웹 화면 ← 이번 담당
```

예를 들어 S03은 다음처럼 구성됩니다.

```text
ReviewScreen.tsx          기능·상태·화면 이동
ReviewView.types.ts       View가 받는 데이터와 함수의 규격
ReviewView.tsx            Android·iOS 기본 UI
ReviewView.web.tsx        웹 UI
```

Expo는 브라우저에서 실행할 때 자동으로 `.web.tsx`를 우선 선택하고, Android·iOS에서 실행할 때 기본 `.tsx` View를 사용합니다.

### props란 무엇인가

props는 기능 담당자가 View에 전달하는 값과 함수입니다.

```tsx
type ExampleViewProps = {
  title: string;
  isLoading: boolean;
  onNext: () => void;
};
```

웹 View는 값을 표시하고 함수를 연결합니다.

```tsx
export function ExampleView({
  title,
  isLoading,
  onNext,
}: ExampleViewProps) {
  return (
    <View>
      <Text>{title}</Text>
      <Button
        loading={isLoading}
        onPress={onNext}
        title="다음"
      />
    </View>
  );
}
```

`onNext` 함수 안에서 무엇을 하는지는 웹 View가 결정하지 않습니다.

### 파일 소유 범위

| 구분 | 담당 | 웹 화면 작업에서 수정 여부 |
|---|---|---|
| `*View.web.tsx` | 웹 화면 담당 | 수정 |
| 웹 전용 표시 컴포넌트 | 웹 화면 담당 | 필요한 경우 수정 |
| `*View.types.ts` | 기능·앱 담당 | 수정하지 않음 |
| `*Screen.tsx` | 기능·앱 담당 | 수정하지 않음 |
| 기본 `*View.tsx` | 기능·앱 담당 | 수정하지 않음 |
| `CaseDraftContext.tsx` | 기능·앱 담당 | 수정하지 않음 |
| `app/**` route 파일 | 기능·앱 담당 | 수정하지 않음 |
| API·service·device 파일 | 기능·앱 담당 | 수정하지 않음 |
| `apps/web/**` | 별도 Next.js 영역 | 수정하지 않음 |

담당 범위가 아닌 파일을 바꿔야 할 것처럼 보이면 먼저 변경하지 말고 파일 경로와 필요한 이유를 전달합니다.

---

## 2. 작업 시작 전 준비 확인

웹 화면 작업을 시작하기 전에 기능·앱 담당자가 아래 기반을 준비합니다.

- S01~S05 route
- 각 화면의 Screen 또는 Controller
- 각 View의 `types.ts`
- 각 View의 기본 `.tsx`
- 웹 View가 받을 예시 데이터
- 버튼과 입력창에 연결할 이벤트 함수
- 공통 디자인 토큰
- 공통 Button과 TextInput

저장소에서 다음과 비슷한 파일을 확인합니다.

```text
apps/mobile/src/features/home/screens/HomeScreen.tsx
apps/mobile/src/features/home/views/HomeView.types.ts
apps/mobile/src/features/home/views/HomeView.tsx

apps/mobile/src/features/case/screens/VoiceInputScreen.tsx
apps/mobile/src/features/case/screens/ReviewScreen.tsx
apps/mobile/src/features/case/screens/QuestionsScreen.tsx
apps/mobile/src/features/case/screens/ConfirmationScreen.tsx

apps/mobile/src/features/case/views/VoiceInputView.types.ts
apps/mobile/src/features/case/views/ReviewView.types.ts
apps/mobile/src/features/case/views/QuestionsView.types.ts
apps/mobile/src/features/case/views/ConfirmationView.types.ts
```

파일 이름은 구현 시 조금 달라질 수 있습니다. 팀에서 전달한 경로를 우선합니다.

`types.ts`, Screen, route가 아직 없다면 웹 View에서 임의로 만들지 않습니다. 필요한 파일 목록을 기능·앱 담당자에게 전달하고 기반이 준비된 다음 시작합니다. 이 경계를 지켜야 앱과 웹이 같은 기능을 공유할 수 있습니다.

---

## 3. 필요한 프로그램 설치

다음 프로그램을 설치합니다.

1. Git: <https://git-scm.com/download/win>
2. Node.js LTS: <https://nodejs.org/>
3. Visual Studio Code: <https://code.visualstudio.com/>

설치 후 VS Code를 열고 상단 메뉴에서 **Terminal → New Terminal**을 누릅니다.

아래 명령어를 각각 실행합니다.

```powershell
git --version
```

```powershell
node --version
```

```powershell
corepack enable
```

```powershell
pnpm.cmd --version
```

저장소는 pnpm `10.14.0`을 사용합니다.

### pnpm 실행 오류가 표시될 때

`pnpm.ps1 cannot be loaded because running scripts is disabled`라는 문장이 보이면 `pnpm` 대신 `pnpm.cmd`를 사용합니다. 이 문서의 명령어는 모두 `pnpm.cmd`로 작성되어 있습니다.

---

## 4. 저장소 Clone

바탕 화면에 저장소를 내려받는 예시입니다.

```powershell
cd $HOME\Desktop
```

```powershell
git clone https://github.com/team-mallang/likelion-hackathon.git
```

```powershell
cd likelion-hackathon
```

현재 위치를 확인합니다.

```powershell
Get-Location
```

마지막 폴더 이름이 `likelion-hackathon`이어야 합니다.

VS Code로 프로젝트를 엽니다.

```powershell
code .
```

새 VS Code 창에서 **Terminal → New Terminal**을 눌러 터미널을 엽니다. 이후 명령은 모두 프로젝트 최상위 폴더에서 실행합니다.

---

## 5. 작업 브랜치 만들기

기능·앱 담당자가 웹 View 계약을 준비해 `dev`에 반영했다는 안내를 받은 다음 진행합니다.

원격 저장소의 최신 정보를 받습니다.

```powershell
git fetch origin
```

`dev` 브랜치로 이동합니다.

```powershell
git switch dev
```

최신 코드를 받습니다.

```powershell
git pull origin dev
```

웹 화면 작업 브랜치를 만듭니다.

```powershell
git switch -c feat/expo-web-s01-s05
```

현재 브랜치를 확인합니다.

```powershell
git branch --show-current
```

결과는 다음과 같아야 합니다.

```text
feat/expo-web-s01-s05
```

변경 파일을 확인합니다.

```powershell
git status --short
```

아무 줄도 표시되지 않으면 작업을 시작할 수 있습니다.

> 기능·앱 담당자가 별도의 기준 브랜치를 전달했다면 `dev` 대신 전달받은 브랜치를 사용합니다. 기준 브랜치 이름을 추측하지 않습니다.

---

## 6. 패키지 설치와 Expo Web 실행

패키지를 설치합니다.

```powershell
pnpm.cmd install
```

Expo Web을 실행합니다.

```powershell
pnpm.cmd --filter mobile web
```

브라우저가 자동으로 열리지 않으면 터미널에 표시된 주소를 Chrome 주소창에 입력합니다. 보통 다음 주소를 사용합니다.

```text
http://localhost:8081
```

`Use port 8082 instead?`처럼 다른 포트 사용 여부를 물으면 `Y`를 입력하고 Enter를 누릅니다.

실행을 종료하려면 Expo가 실행 중인 터미널을 클릭하고 `Ctrl + C`를 누릅니다.

---

## 7. 수정 가능한 파일 확인

VS Code 왼쪽 Explorer에서 기능·앱 담당자가 준비한 `views` 폴더를 찾습니다.

권장 구조는 다음과 같습니다.

```text
apps/mobile/src/features/
├─ home/
│  ├─ screens/
│  │  └─ HomeScreen.tsx
│  └─ views/
│     ├─ HomeView.types.ts
│     ├─ HomeView.tsx
│     └─ HomeView.web.tsx
└─ case/
   ├─ screens/
   │  ├─ VoiceInputScreen.tsx
   │  ├─ ReviewScreen.tsx
   │  ├─ QuestionsScreen.tsx
   │  └─ ConfirmationScreen.tsx
   └─ views/
      ├─ VoiceInputView.types.ts
      ├─ VoiceInputView.tsx
      ├─ VoiceInputView.web.tsx
      ├─ ReviewView.types.ts
      ├─ ReviewView.tsx
      ├─ ReviewView.web.tsx
      ├─ QuestionsView.types.ts
      ├─ QuestionsView.tsx
      ├─ QuestionsView.web.tsx
      ├─ ConfirmationView.types.ts
      ├─ ConfirmationView.tsx
      └─ ConfirmationView.web.tsx
```

웹 담당자가 새로 만들거나 수정하는 핵심 파일은 아래 다섯 개입니다.

```text
HomeView.web.tsx
VoiceInputView.web.tsx
ReviewView.web.tsx
QuestionsView.web.tsx
ConfirmationView.web.tsx
```

웹에서만 재사용할 작은 컴포넌트가 필요하면 다음 폴더를 사용합니다.

```text
apps/mobile/src/components/web/
```

예시:

```text
WebPageShell.web.tsx
WebCard.web.tsx
WebFieldRow.web.tsx
```

공통 토큰에 없는 웹 전용 스타일이 필요하면 먼저 기존 토큰을 조합합니다. 토큰 자체의 변경이 필요하면 기능·앱 담당자에게 변경 이유를 전달합니다.

---

## 8. View types 파일 읽기

각 웹 화면을 만들기 전에 같은 이름의 `types.ts`를 먼저 엽니다.

예를 들어 `ReviewView.types.ts`가 다음과 같다고 가정합니다.

```tsx
export type ReviewViewProps = {
  statement: string;
  locationText: string;
  occurredAtText: string;
  isEditing: boolean;
  isAnalyzing: boolean;
  errorMessage: string | null;
  onStatementChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onOccurredAtChange: (value: string) => void;
  onEditToggle: () => void;
  onAnalyze: () => void;
  onRecordAgain: () => void;
  onBack: () => void;
};
```

이 파일은 웹 View가 사용할 수 있는 항목 목록입니다.

- `string`: 화면에 표시할 글자
- `boolean`: 로딩 또는 편집 상태 판단
- `string | null`: 오류 문구가 있거나 없는 상태
- `() => void`: 버튼을 눌렀을 때 호출할 함수
- `(value: string) => void`: 입력한 글자를 전달할 함수

웹 View에서는 목록에 있는 값만 사용합니다. 필요한 값이나 함수가 없으면 `types.ts`를 직접 변경하지 않고 기능·앱 담당자에게 요청합니다.

요청 예시:

```text
ReviewView.web.tsx에서 분석 예상 유형을 표시하려고 합니다.
ReviewViewProps에 expectedCaseTypeLabel 문자열을 전달해주세요.
```

---

## 9. 웹 View 기본 작성법

웹 화면에서도 HTML의 `div`, `button`, `input`을 직접 사용하지 않습니다. Expo Web이 변환할 수 있도록 React Native 요소를 사용합니다.

| 요소 | 역할 |
|---|---|
| `View` | 영역을 묶고 배치 |
| `Text` | 글자 표시 |
| `Pressable` | 누르는 영역 |
| `TextInput` | 글 입력 |
| `StyleSheet` | 화면 스타일 정의 |
| `useWindowDimensions` | 브라우저 폭 확인 |

기본 형태:

```tsx
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import type { ExampleViewProps } from "./ExampleView.types";

export function ExampleView({
  title,
  onNext,
}: ExampleViewProps) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 700;
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>

        <Pressable
          accessibilityRole="button"
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onHoverIn={() => setIsHovered(true)}
          onHoverOut={() => setIsHovered(false)}
          onPress={onNext}
          style={({ pressed }) => [
            styles.button,
            isHovered && styles.buttonHovered,
            isFocused && styles.buttonFocused,
            pressed && styles.buttonPressed,
            isNarrow && styles.buttonNarrow,
          ]}
        >
          <Text style={styles.buttonText}>다음</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  content: {
    width: "100%",
    maxWidth: 1120,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
  },
  button: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#2563EB",
  },
  buttonHovered: {
    opacity: 0.9,
  },
  buttonFocused: {
    outlineColor: "#2563EB",
    outlineStyle: "solid",
    outlineWidth: 3,
  },
  buttonPressed: {
    opacity: 0.75,
  },
  buttonNarrow: {
    width: "100%",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
```

`isHovered`와 `isFocused`는 기능 데이터가 아니라 웹 요소의 시각적 상호작용만 나타내는 View 내부 상태입니다. 사건 내용, 질문 순서, 저장 상태 같은 기능 데이터는 View 내부 상태로 만들지 않습니다.

프로젝트의 공통 Button이 hover와 focus를 이미 지원한다면 공통 Button을 우선 사용합니다.

### 웹 View에서 import하지 않는 항목

다음 항목이 필요해 보이면 기능·앱 담당자에게 props 제공을 요청합니다.

```text
expo-router
expo-location
expo-audio
expo-av
CaseDraftContext
useCaseDraft
API client
fetch
axios
```

웹 View에서 `router.push()`, `updateDraft()`, `fetch()` 등을 직접 호출하지 않습니다.

---

## 10. 공통 웹 레이아웃 기준

S01~S05가 같은 서비스처럼 보이도록 다음 기준을 유지합니다.

### 데스크톱

- 전체 페이지 최대 폭: 약 1120px
- 입력 흐름 본문 최대 폭: 약 720px
- 좌우 여백: 최소 24px
- 상단 헤더와 본문을 분리
- 주요 버튼과 보조 버튼의 차이를 명확하게 표시
- 긴 폼은 카드 또는 구분선으로 묶기

### 좁은 브라우저

- 기준 폭: 700px 미만
- 좌우 여백: 16px 이상
- 나란한 버튼이 좁아지면 세로 배치
- 입력창과 버튼은 가급적 전체 폭 사용
- 가로 스크롤이 생기지 않게 처리

```tsx
const { width } = useWindowDimensions();
const isNarrow = width < 700;
```

```tsx
<View style={[styles.buttonRow, isNarrow && styles.buttonColumn]}>
```

```tsx
buttonRow: {
  flexDirection: "row",
  gap: 12,
},
buttonColumn: {
  flexDirection: "column",
},
```

### 텍스트

- 페이지 제목은 가장 크게 표시
- 설명은 제목보다 작고 옅게 표시
- 오류는 입력창 가까이에 표시
- 버튼 글자는 행동이 분명하게 보이도록 작성
- 한 화면에서 같은 크기와 굵기를 일관되게 사용

### 접근성

- Pressable에 `accessibilityRole="button"` 지정
- 입력창에 label 또는 `accessibilityLabel` 제공
- 비활성 버튼은 `disabled`와 `accessibilityState` 반영
- 색상만으로 오류와 상태를 구분하지 않기
- Tab 키로 버튼과 입력창을 이동할 수 있게 유지
- focus 표시를 제거하지 않기

---

## 11. S01 홈 웹 화면

수정 파일:

```text
apps/mobile/src/features/home/views/HomeView.web.tsx
```

`HomeView.types.ts`를 먼저 읽고 제공되는 props 이름을 확인합니다.

### 표시할 내용

- `Travel Guard` 서비스명과 로고 영역
- `일본에서 도난·분실 사고를 겪으셨나요?`
- 상황을 알려주면 해야 할 일을 안내한다는 설명
- `사건 발생·가이드 시작` 주요 버튼
- `로그인 없이 바로 시작` 보조 문구
- `이전 사건 조회` 보조 버튼
- `진행 상황 조회` 보조 문구
- 일본 긴급 신고 번호 `110/119` 안내
- 저작권 문구
- 서류·가이드 내비게이션

### 연결할 함수

실제 이름은 `HomeView.types.ts`에서 확인합니다.

```text
사건 시작 버튼     → onStartCase
이전 사건 조회     → onPreviousCase
서류               → onDocuments
가이드             → onGuide
```

웹 View에는 화면 이동 주소를 적지 않습니다. 각 버튼은 전달받은 함수를 실행합니다.

```tsx
<Button
  onPress={onStartCase}
  title="사건 발생·가이드 시작"
/>
```

### 웹 배치

- 데스크톱에서는 시작과 이전 조회 카드를 나란히 표시 가능
- 좁은 화면에서는 두 카드를 세로로 표시
- 긴급 신고 안내는 주요 작업 버튼과 시각적으로 구분
- 버튼 hover와 focus 상태 확인

### 완료 확인

- [ ] S01의 모든 문구가 보임
- [ ] 네 개의 동작 요소에 전달받은 함수가 연결됨
- [ ] 웹 View에 router import가 없음
- [ ] 390px와 1280px에서 배치가 안정적임

---

## 12. S02 음성 입력 웹 화면

수정 파일:

```text
apps/mobile/src/features/case/views/VoiceInputView.web.tsx
```

### 표시할 내용

- 뒤로 가기
- `분실·도난 신고` 제목과 단계
- `무슨 일이 있었는지 알려주세요`
- 사건 설명 안내
- 마이크 모양의 큰 버튼
- 대기 중·녹음 중 상태
- 녹음 시간
- 인식된 문장
- 녹음 시작·중지 버튼
- 다시 녹음 버튼
- 텍스트 입력 전환 버튼
- 텍스트 입력창
- 현재 위치
- 현지 시간
- 오프라인 작성 안내
- 권한 오류 또는 기능 오류 문구

### props 연결

`VoiceInputView.types.ts`에 있는 실제 이름을 사용합니다. 구조는 다음과 비슷합니다.

```text
statement             화면에 표시할 사건 문장
inputMode             voice 또는 text
recordingState         idle, recording, processing 등
recordingTimeLabel     00:17 같은 글자
locationText           현재 위치 글자
localTimeText          현지 시간 글자
isBusy                 처리 중 여부
errorMessage           오류 문구
onRecordStart          녹음 시작 요청
onRecordStop           녹음 중지 요청
onRecordAgain          다시 녹음 요청
onInputModeChange      음성·텍스트 모드 변경
onStatementChange      텍스트 입력값 전달
onContinue             다음 단계 요청
onBack                 뒤로 가기 요청
```

웹 View는 마이크 권한을 요청하지 않습니다. 마이크 버튼을 누를 때 `onRecordStart`만 호출합니다.

```tsx
<Pressable
  accessibilityLabel="음성 녹음 시작"
  accessibilityRole="button"
  onPress={onRecordStart}
>
  <Text>🎙</Text>
</Pressable>
```

텍스트 입력:

```tsx
<AppTextInput
  accessibilityLabel="사건 내용"
  label="사건 내용"
  multiline
  onChangeText={onStatementChange}
  placeholder="언제, 어디에서, 무슨 일이 있었는지 입력해주세요."
  value={statement}
/>
```

### 상태별 표시

- `idle`: 녹음 시작 안내
- `recording`: 빨간 상태점, 녹음 중 문구, 시간, 중지 버튼
- `processing`: 처리 중 표시, 버튼 비활성
- `text`: TextInput과 계속 버튼
- 오류: 오류 문구와 다시 시도할 수 있는 버튼

상태를 웹 View 내부에서 새로 만들지 않습니다. 전달받은 상태에 따라 다른 UI를 보여줍니다.

### 완료 확인

- [ ] 모든 버튼이 props의 함수만 호출함
- [ ] Expo 오디오 라이브러리 import가 없음
- [ ] 처리 중에는 중복 클릭이 차단됨
- [ ] 오류 문구가 마이크 또는 입력 영역 가까이에 보임
- [ ] 좁은 화면에서 버튼과 입력창이 겹치지 않음

---

## 13. S03 녹음 내용 확인 웹 화면

수정 파일:

```text
apps/mobile/src/features/case/views/ReviewView.web.tsx
```

### 표시할 내용

- 뒤로 가기
- `말씀해주신 내용이 맞나요?`
- 진행률
- `녹음된 내용`과 사건 문장
- 내용 수정 버튼과 편집 입력창
- 다시 녹음하기
- 위치와 시간
- 위치·시간 수정 UI
- AI가 신고서 초안을 구성한다는 안내
- 예상 신고 유형
- `이 내용으로 분석하기` 버튼
- 분석 중, 입력 오류, 분석 오류 상태

### props 연결

화면 값은 props에서 읽습니다.

```tsx
<Text>{statement}</Text>
<Text>{locationText}</Text>
<Text>{occurredAtText}</Text>
```

수정 입력값은 전달받은 함수에 넘깁니다.

```tsx
<AppTextInput
  label="사건 내용"
  multiline
  onChangeText={onStatementChange}
  value={statement}
/>
```

분석 버튼은 함수만 호출합니다.

```tsx
<Button
  disabled={!canAnalyze}
  loading={isAnalyzing}
  onPress={onAnalyze}
  title="이 내용으로 분석하기"
/>
```

`canAnalyze` 계산과 분석 후 이동은 기능 담당자가 처리합니다.

### 웹 배치

- 데스크톱에서는 사건 내용과 위치·시간을 카드 단위로 정돈
- 편집 모드에서도 전체 폭이 갑자기 변하지 않게 처리
- 주요 분석 버튼은 다른 보조 버튼보다 분명하게 표시
- 긴 사건 내용은 줄바꿈되고 카드 밖으로 넘치지 않게 처리

### 완료 확인

- [ ] 문장·위치·시간을 props에서 표시함
- [ ] 수정값을 각각 전달받은 함수로 넘김
- [ ] 분석 상태를 props로만 판단함
- [ ] Context와 router import가 없음
- [ ] 긴 문장을 넣어도 가로 스크롤이 생기지 않음

---

## 14. S04 추가 질문 웹 화면

수정 파일:

```text
apps/mobile/src/features/case/views/QuestionsView.web.tsx
```

### 표시할 내용

- 뒤로 가기
- `분실·도난 신고`와 단계
- 진행률
- `AI 분석 기반 추가 질문`
- 추가 정보가 필요한 이유
- 현재 질문 순서
- 현재 질문 한 개
- 답변 입력창 또는 선택지
- 이전 질문·다음 질문 버튼
- 마지막 단계 분석 버튼
- 답변 누락, 저장 중, 저장 실패 상태
- 질문이 없을 때 안내

### props 연결

View는 질문 배열을 직접 탐색해 다음 질문을 결정하지 않습니다. 기능 담당자가 현재 질문을 계산해 전달합니다.

예상 props:

```text
currentQuestion
currentAnswer
currentIndex
totalCount
progress
isFirstQuestion
isLastQuestion
isSaving
errorMessage
onAnswerChange
onPrevious
onNext
onComplete
onBack
```

질문 순서 표시 예시:

```tsx
<Text>
  {currentIndex + 1}/{totalCount}
</Text>
```

답변 입력:

```tsx
<AppTextInput
  label="답변"
  multiline
  onChangeText={onAnswerChange}
  placeholder="답변을 입력해주세요."
  value={currentAnswer}
/>
```

버튼 연결:

```tsx
{isLastQuestion ? (
  <Button
    loading={isSaving}
    onPress={onComplete}
    title="이 내용으로 분석하기"
  />
) : (
  <Button
    onPress={onNext}
    title="다음 질문"
  />
)}
```

답변 누락 검사와 질문 번호 변경은 기능 담당자가 처리합니다.

### 질문이 없을 때

`currentQuestion`이 없으면 입력창을 그리지 않습니다. 전달받은 안내 문구와 돌아가기 버튼을 표시합니다.

### 완료 확인

- [ ] 현재 질문 하나만 표시함
- [ ] 순서와 진행률을 props에서 표시함
- [ ] 답변을 `onAnswerChange`에 전달함
- [ ] 질문 인덱스를 View 내부에서 변경하지 않음
- [ ] 첫 질문과 마지막 질문의 버튼 모양이 자연스러움
- [ ] 질문이 없는 상태가 준비됨

---

## 15. S05 사건 카드 내용 확정 웹 화면

수정 파일:

```text
apps/mobile/src/features/case/views/ConfirmationView.web.tsx
```

### 표시할 내용

- 뒤로 가기
- `사건 내용이 이렇게 정리됐어요`
- 사건 유형
- 사건 유형 수정 UI
- 물품 목록
- 물품 추가·수정·삭제 UI
- 발생 시간
- 발생 장소
- 긴급 물품 포함 여부
- 위험도
- 상세 특징
- 추가 단서
- 상세 정보 수정 UI
- `사건 내용 확정하기` 버튼
- 필수값 오류
- 저장 중, 저장 실패, 저장 완료 상태

### props 연결

예상 props:

```text
caseTypeLabel
items
occurredAtText
locationText
emergencyItemIncluded
riskLevelLabel
details
clues
isEditing
isSaving
isSaved
errorMessage
onCaseTypeChange
onItemAdd
onItemChange
onItemRemove
onOccurredAtChange
onLocationChange
onDetailsChange
onCluesChange
onEditToggle
onConfirm
onBack
```

물품 목록 표시:

```tsx
{items.map((item) => (
  <View key={item.id} style={styles.itemCard}>
    <Text style={styles.itemName}>{item.name}</Text>
    <Text style={styles.itemDescription}>{item.description}</Text>

    <Button
      onPress={() => onItemRemove(item.id)}
      title="삭제"
      variant="outline"
    />
  </View>
))}
```

`item.id`처럼 어떤 식별자를 사용하는지는 실제 types 파일을 따릅니다. View 안에서 물품 배열을 직접 수정하지 않습니다.

확정 버튼:

```tsx
<Button
  disabled={!canConfirm}
  loading={isSaving}
  onPress={onConfirm}
  title="사건 내용 확정하기"
/>
```

필수값 검사, API 저장, S06 이동은 기능 담당자가 처리합니다.

### 웹 배치

- 데스크톱에서는 기본 정보와 상세 정보를 두 열로 배치 가능
- 좁은 화면에서는 한 열로 변경
- 정보 확인 상태와 편집 상태를 시각적으로 구분
- 위험도와 긴급 물품은 색상 외에 글자로도 표시
- 저장 완료 메시지는 확정 버튼 가까이에 표시

### 완료 확인

- [ ] 모든 사건 정보를 props에서 표시함
- [ ] 수정·추가·삭제는 전달받은 함수만 호출함
- [ ] 배열이나 사건 객체를 직접 변경하지 않음
- [ ] 저장 중 중복 클릭이 차단됨
- [ ] 오류와 완료 상태가 모두 보임
- [ ] API와 router import가 없음

---

## 16. 로딩·오류·빈 상태 작성 원칙

기능 담당자가 전달하는 상태를 다음처럼 화면에 반영합니다.

### 로딩

- 주요 버튼에 spinner 또는 `처리 중...` 표시
- 같은 요청을 다시 누르지 못하도록 disabled 처리
- 이미 작성한 내용을 지우지 않음

### 오류

- 오류가 발생한 영역 가까이에 문구 표시
- 빨간색뿐 아니라 오류 문장 또는 아이콘 함께 사용
- 다시 시도할 함수가 전달되면 버튼 연결
- 전달받은 오류 문구를 임의로 다른 의미로 바꾸지 않음

### 빈 상태

- 빈 카드만 표시하지 않음
- 데이터가 없는 이유와 가능한 다음 행동 표시
- 돌아가기 또는 다시 불러오기 함수가 있으면 연결

### 완료

- 작업이 완료되었다는 문장을 표시
- 다음 버튼이 있다면 전달받은 함수 연결
- View에서 임의로 다른 URL로 이동하지 않음

---

## 17. 브라우저 화면 확인

파일을 `Ctrl + S`로 저장하면 Expo Web에 자동 반영됩니다.

브라우저에서 `F12`를 눌러 개발자 도구를 엽니다. 기기 모양 아이콘을 눌러 화면 폭을 바꿉니다.

다음 폭을 확인합니다.

- 390px: 좁은 모바일 브라우저
- 768px: 태블릿 또는 작은 창
- 1280px: 일반 데스크톱
- 1440px: 넓은 데스크톱

각 화면에서 확인합니다.

- 가로 스크롤이 생기지 않음
- 글자가 화면 밖으로 나가지 않음
- 버튼과 입력창이 겹치지 않음
- 큰 화면에서 내용이 지나치게 늘어나지 않음
- 작은 화면에서 버튼이 누르기 어려울 정도로 좁아지지 않음
- 모달 또는 안내 영역이 화면 안에 보임

### 키보드 확인

마우스를 사용하지 않고 `Tab` 키를 반복해서 누릅니다.

- 입력창과 버튼으로 순서대로 이동
- 현재 선택된 요소에 focus 표시가 보임
- Enter 또는 Space로 버튼 사용 가능
- 비활성 버튼은 실행되지 않음

### 콘솔 확인

개발자 도구의 Console 탭을 엽니다.

- 빨간 오류가 없어야 함
- `Each child in a list should have a unique key` 경고가 없어야 함
- 알 수 없는 props 관련 경고가 없어야 함

---

## 18. 작업 중 변경 파일 확인

수시로 다음 명령을 실행합니다.

```powershell
git status --short
```

변경이 예상되는 파일:

```text
apps/mobile/src/features/home/views/*View.web.tsx
apps/mobile/src/features/case/views/*View.web.tsx
apps/mobile/src/components/web/**
```

아래 파일이 표시되면 커밋 전에 이유를 확인합니다.

```text
기본 *View.tsx
*View.types.ts
*Screen.tsx
CaseDraftContext.tsx
apps/mobile/app/**
apps/web/**
.env
pnpm-lock.yaml
```

담당 범위가 아닌 파일의 기존 내용을 임의로 되돌리거나 삭제하지 않습니다.

---

## 19. 화면별 완료 체크리스트

### 공통

- [ ] 수정 파일이 `.web.tsx` 또는 웹 전용 컴포넌트임
- [ ] router, Context, API, Expo 기기 라이브러리를 import하지 않음
- [ ] 데이터는 props에서 읽음
- [ ] 버튼과 입력은 props의 함수를 호출함
- [ ] Android·iOS View를 수정하지 않음
- [ ] 390px, 768px, 1280px, 1440px에서 확인함
- [ ] Tab 키 focus가 보임
- [ ] 로딩·오류·빈 상태가 준비됨
- [ ] 브라우저 Console에 빨간 오류가 없음

### S01

- [ ] 서비스 소개와 두 개의 주요 선택 영역이 보임
- [ ] 긴급 신고 안내가 보임
- [ ] 시작·조회·서류·가이드 함수를 연결함

### S02

- [ ] 음성·텍스트 모드를 전달받은 상태대로 표시함
- [ ] 마이크 기능을 직접 구현하지 않음
- [ ] 입력값을 전달받은 함수에 넘김
- [ ] 녹음·처리·오류 상태를 표시함

### S03

- [ ] 사건 문장·위치·시간이 보임
- [ ] 편집 상태를 전달받은 값대로 표시함
- [ ] 분석 버튼에 전달받은 함수를 연결함

### S04

- [ ] 현재 질문 한 개와 진행률이 보임
- [ ] 답변을 전달받은 함수에 넘김
- [ ] 질문 순서를 View 내부에서 관리하지 않음

### S05

- [ ] 사건 카드 정보를 모두 표시함
- [ ] 수정·추가·삭제 함수를 연결함
- [ ] 저장 로직을 직접 구현하지 않음
- [ ] 저장 중·오류·완료 상태를 표시함

---

## 20. 코드 검사

Expo가 실행 중인 터미널은 그대로 두고 VS Code에서 **Terminal → New Terminal**을 눌러 두 번째 터미널을 엽니다.

TypeScript 검사를 실행합니다.

```powershell
pnpm.cmd --filter mobile typecheck
```

오류 없이 명령이 끝나야 합니다. 오류가 표시되면 파일 경로와 줄 번호를 확인합니다.

Git 공백 오류를 확인합니다.

```powershell
git diff --check
```

아무 내용도 표시되지 않으면 통과입니다.

담당 범위를 벗어난 import가 없는지 확인합니다.

```powershell
rg -n "expo-router|useCaseDraft|CaseDraftContext|fetch\(|axios|expo-location|expo-audio" apps/mobile/src/features -g "*.web.tsx"
```

아무 결과도 나오지 않는 것이 기준입니다. 결과가 나오면 해당 파일에서 기능 코드를 제거하고 전달받은 props를 사용합니다.

---

## 21. 커밋하기

### 변경 확인

```powershell
git status --short
```

```powershell
git diff --stat
```

```powershell
git diff
```

`git diff` 화면을 종료하려면 `q`를 누릅니다.

### S01~S02 커밋 예시

```powershell
git add apps/mobile/src/features/home/views/HomeView.web.tsx apps/mobile/src/features/case/views/VoiceInputView.web.tsx
```

```powershell
git status
```

`Changes to be committed` 아래에 웹 View만 있는지 확인합니다.

```powershell
git commit -m "feat: Expo Web S01~S02 화면 구현"
```

### S03~S05 커밋 예시

```powershell
git add apps/mobile/src/features/case/views/ReviewView.web.tsx apps/mobile/src/features/case/views/QuestionsView.web.tsx apps/mobile/src/features/case/views/ConfirmationView.web.tsx
```

웹 전용 공통 컴포넌트를 만들었다면 실제 경로를 추가합니다.

```powershell
git status
```

```powershell
git commit -m "feat: Expo Web S03~S05 화면 구현"
```

### 잘못된 파일을 선택했을 때

커밋 전이라면 파일 내용은 유지하고 Git 선택만 취소합니다.

```powershell
git restore --staged 파일경로
```

예시:

```powershell
git restore --staged apps/mobile/src/features/case/views/ReviewView.tsx
```

`.env`, API 키, 비밀번호, 실제 개인정보는 커밋하지 않습니다.

### Git 이름 설정 메시지가 나올 때

```powershell
git config --global user.name "GitHub 사용자 이름"
```

```powershell
git config --global user.email "GitHub 이메일"
```

설정한 다음 실패했던 commit 명령을 다시 실행합니다.

---

## 22. Push하기

처음 Push할 때 실행합니다.

```powershell
git push -u origin feat/expo-web-s01-s05
```

이후 같은 브랜치에서는 다음 명령만 실행합니다.

```powershell
git push
```

GitHub 로그인 창이 표시되면 저장소 접근 권한이 있는 계정으로 로그인합니다.

---

## 23. Pull Request 만들기

GitHub 저장소에서 다음 순서로 진행합니다.

1. `Compare & pull request`를 누릅니다.
2. base 브랜치를 `dev`로 선택합니다.
3. compare 브랜치가 `feat/expo-web-s01-s05`인지 확인합니다.
4. 제목을 `feat: Expo Web S01~S05 화면 구현`으로 작성합니다.
5. 아래 내용을 PR 설명에 복사하고 결과에 맞게 체크합니다.

```markdown
## 작업 내용

- S01~S05 Expo Web 전용 View 구현
- 데스크톱·태블릿·모바일 브라우저 반응형 배치
- hover·focus·키보드 이동 처리
- 전달받은 props와 이벤트 함수 연결
- 로딩·오류·빈 상태·완료 상태 UI 구현

## 담당 경계

- 기능, API, 상태, Router는 변경하지 않았습니다.
- Android·iOS View는 변경하지 않았습니다.
- `.web.tsx`와 웹 전용 표시 컴포넌트만 변경했습니다.

## 확인 방법

1. `pnpm.cmd install`
2. `pnpm.cmd --filter mobile web`
3. S01에서 S05까지 화면 확인
4. 390px, 768px, 1280px, 1440px 폭 확인
5. Tab 키로 focus 이동 확인

## 검사

- [ ] `pnpm.cmd --filter mobile typecheck`
- [ ] `git diff --check`
- [ ] 브라우저 Console 오류 없음
- [ ] 범위 밖 import 검사 완료
```

6. 각 화면의 390px와 1280px 스크린샷을 첨부합니다.
7. `Create pull request`를 누릅니다.
8. 기능·앱 담당자에게 리뷰를 요청합니다.

리뷰 전에는 직접 Merge하지 않습니다.

---

## 24. 리뷰 수정 반영

리뷰 수정은 같은 브랜치에서 진행합니다.

파일을 수정한 다음 검사를 다시 실행합니다.

```powershell
pnpm.cmd --filter mobile typecheck
```

```powershell
git diff --check
```

변경한 웹 파일만 선택합니다.

```powershell
git add 수정한웹파일경로
```

```powershell
git commit -m "fix: Expo Web 화면 리뷰 반영"
```

```powershell
git push
```

기존 PR에 자동으로 반영되므로 새 PR을 만들지 않습니다.

---

## 25. 다음 작업일에 이어서 시작하기

```powershell
git switch feat/expo-web-s01-s05
```

```powershell
git status
```

```powershell
git pull
```

```powershell
pnpm.cmd --filter mobile web
```

작업을 마칠 때는 다음 순서를 지킵니다.

1. VS Code 파일 저장
2. 브라우저 화면 확인
3. TypeScript 검사
4. `git status` 확인
5. 웹 전용 파일만 commit
6. Push

---

## 26. 문제가 생겼을 때 전달할 정보

다음 정보를 함께 전달합니다.

1. 실행한 명령어
2. 터미널의 첫 오류 문장부터 마지막 줄까지
3. 오류가 발생한 파일 경로와 줄 번호
4. `git branch --show-current` 결과
5. `git status --short` 결과
6. 사용하려던 props 이름

예시:

```text
ConfirmationView.web.tsx에서 onItemRemove를 연결하려고 했는데
ConfirmationViewProps에 해당 함수가 없습니다.
물품 삭제용 props 이름을 확인해주세요.
```

API 키, `.env` 내용, 실제 개인정보는 캡처나 메시지에 포함하지 않습니다.

---

## 27. 최종 완료 기준

다음 조건을 모두 만족하면 웹 화면 작업이 완료됩니다.

- S01~S05의 `.web.tsx` View가 구현됨
- 화면 데이터가 모두 props에서 전달됨
- 사용자 입력과 버튼이 props 함수에 연결됨
- 기능·상태·라우팅·API를 웹 View에서 구현하지 않음
- Android·iOS View를 수정하지 않음
- 네 가지 브라우저 폭에서 레이아웃을 확인함
- 키보드 focus와 hover 상태를 확인함
- 로딩·오류·빈 상태·완료 상태를 확인함
- TypeScript와 Git 공백 검사를 통과함
- 웹 전용 파일만 커밋함
- GitHub에 Push하고 PR을 생성함

검사 명령:

```powershell
pnpm.cmd --filter mobile typecheck
```

```powershell
git diff --check
```

```powershell
rg -n "expo-router|useCaseDraft|CaseDraftContext|fetch\(|axios|expo-location|expo-audio" apps/mobile/src/features -g "*.web.tsx"
```

화면 세부 문구와 요소는 `docs/USER_FLOW.md`의 S01~S05를 기준으로 확인합니다. 기능과 props의 실제 이름은 기능·앱 담당자가 준비한 각 `*View.types.ts`를 기준으로 사용합니다.
