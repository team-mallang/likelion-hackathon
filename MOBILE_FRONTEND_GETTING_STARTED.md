# 실기기에서 PC를 임시 API 서버로 사용하는 방법

모바일 앱은 OpenAI·ElevenLabs 같은 비밀 API 키를 직접 사용하지 않는다. 실기기는 PC에서 실행 중인 Next.js API 서버에 요청하고, PC 서버만 비밀 키를 사용한다.

```text
실기기(Expo 개발 빌드)
  -> http://PC의_WIFI_IP:3000/api/...
  -> PC의 Next.js API 서버
  -> OpenAI / ElevenLabs / PostgreSQL
```

`OPENAI_API_KEY`나 `ELEVENLABS_API_KEY`를 `EXPO_PUBLIC_` 변수 또는 모바일 코드에 넣으면 안 된다. `EXPO_PUBLIC_` 값은 앱 번들에서 확인할 수 있으므로, 모바일에는 공개해도 되는 PC API 주소와 Agora App ID만 둔다.

## 1. 실행 방식 확인

이 저장소는 `expo-dev-client`와 `react-native-agora`를 사용한다. Agora를 포함한 전체 기능의 실기기 QA는 일반 Expo Go가 아니라 EAS의 `development` 프로필로 만든 **개발 빌드 앱**을 사용한다.

- 개발 빌드가 이미 설치되어 있으면 네이티브 의존성이나 `app.json`을 변경하지 않는 한 다시 빌드할 필요가 없다.
- 환경변수를 바꾼 뒤 Metro를 다시 시작하고 개발 빌드에서 Reload한다.
- 터미널에 `Using development build`가 표시되는지 확인한다.
- 단순 Expo Go는 커스텀 네이티브 모듈 테스트에 적합하지 않다.

## 2. PC의 실제 Wi-Fi IPv4 확인

PC와 휴대폰을 같은 Wi-Fi에 연결하고 PowerShell에서 실행한다.

```powershell
ipconfig
```

현재 사용 중인 `무선 LAN 어댑터 Wi-Fi`의 `IPv4 주소`를 찾는다. 예를 들어 PC 주소가 `192.168.0.23`이면 모바일이 사용할 API 주소는 `http://192.168.0.23:3000`이다.

다음 주소는 사용하지 않는다.

- `localhost`, `127.0.0.1`: 휴대폰 자기 자신을 가리킨다.
- `.env.example`의 `172.19.80.1`: 예시 또는 가상 어댑터 주소일 수 있다.
- `vEthernet`, WSL, Docker 어댑터 주소: 일반적으로 휴대폰에서 접근할 수 없다.

공용/게스트 Wi-Fi는 기기 간 통신을 차단할 수 있다. VPN도 먼저 끄고 테스트한다.

## 3. 환경변수 파일 만들기

환경변수는 실행하는 프로젝트 디렉터리 기준으로 분리한다. 아래 파일들은 이미 `.gitignore`에 포함되므로 커밋하지 않는다.

### `apps/web/.env.local` — PC 서버 전용 비밀 값

```dotenv
DATABASE_URL="postgresql://postgres:실제_DB_비밀번호@localhost:5432/travel_guard"

# 빠른 화면 흐름 테스트는 true. 실제 OpenAI 호출 테스트는 false.
AI_MOCK_MODE=true
OPENAI_API_KEY=실제_OpenAI_API_키
OPENAI_MODEL=gpt-4o-mini

ELEVENLABS_API_KEY=실제_ElevenLabs_API_키
ELEVENLABS_STT_MODEL=scribe_v2

AGORA_APP_ID=실제_Agora_App_ID
AGORA_APP_CERTIFICATE=실제_Agora_Certificate
AUTH_SECRET=충분히_긴_임의의_문자열
```

UI 이동만 먼저 확인하려면 `AI_MOCK_MODE=true`로 둔다. 이 경우 사건 분석 단계는 OpenAI 키 없이도 mock 응답으로 진행된다. 실제 AI 응답을 검증할 때만 `AI_MOCK_MODE=false`로 바꾸고 `OPENAI_API_KEY`를 설정한다.

### `apps/mobile/.env.local` — 앱에 공개 가능한 값만

아래 IP는 반드시 2단계에서 확인한 PC의 Wi-Fi IPv4로 바꾼다.

```dotenv
EXPO_PUBLIC_API_BASE_URL=http://192.168.0.23:3000
EXPO_PUBLIC_AGORA_APP_ID=실제_Agora_App_ID
```

OpenAI, ElevenLabs, Agora Certificate, DB 비밀번호, AWS Secret은 이 파일에 넣지 않는다.

### 저장소 루트 `.env` — Docker/Prisma용

기존 루트 `.env`에는 최소한 다음 값이 필요하다.

```dotenv
POSTGRES_USER=postgres
POSTGRES_PASSWORD=실제_DB_비밀번호
POSTGRES_DB=travel_guard
DATABASE_URL="postgresql://postgres:실제_DB_비밀번호@localhost:5432/travel_guard"
```

`apps/web/.env.local`과 루트 `.env`의 DB 이름·사용자·비밀번호가 서로 같아야 한다.

## 4. DB와 PC API 서버 실행

저장소 루트에서 터미널을 두 개 연다. 첫 번째 터미널에서 PostgreSQL과 migration을 준비한다.

```powershell
docker compose -f infra/docker-compose.yml up -d postgres
pnpm.cmd --filter @project/db prisma:generate
pnpm.cmd --filter @project/db prisma:migrate
```

두 번째 터미널에서 Next.js API 서버를 모든 LAN 인터페이스에 연다.

```powershell
pnpm.cmd --filter web dev -- --hostname 0.0.0.0 --port 3000
```

PC 브라우저에서 `http://localhost:3000/api/health`를 연다. 정상이면 다음 JSON이 표시된다.

```json
{"status":"ok"}
```

## 5. 휴대폰에서 API 연결 확인

모바일 앱을 켜기 전에 휴대폰 브라우저에서 `http://PC의_WIFI_IP:3000/api/health`를 연다. 예를 들면 다음과 같다.

```text
http://192.168.0.23:3000/api/health
```

휴대폰 브라우저에 `{"status":"ok"}`가 보이면 PC API 서버까지의 연결은 정상이다. 열리지 않으면 앱 문제를 확인하기 전에 다음을 해결한다.

1. PC와 휴대폰이 같은 Wi-Fi인지 확인한다.
2. Windows 네트워크 프로필을 `개인 네트워크`로 설정한다.
3. Next.js 실행 시 나타나는 Windows 방화벽 알림에서 개인 네트워크 접근을 허용한다.
4. 방화벽에서 Node.js의 TCP 3000 인바운드 접근을 허용한다.
5. VPN을 끄고 게스트 Wi-Fi의 기기 간 통신 차단 여부를 확인한다.
6. PC IP가 바뀌었다면 `apps/mobile/.env.local`도 갱신한다.

## 6. Metro와 개발 빌드 실행

세 번째 터미널에서 Metro를 LAN 모드로 시작한다.

```powershell
pnpm.cmd --filter mobile dev:client -- --lan --clear
```

휴대폰에 설치된 Travel Guard 개발 빌드를 열고 QR 코드를 스캔한다. 이미 프로젝트가 열려 있었다면 개발자 메뉴에서 Reload한다.

Expo Go로 제한적인 화면만 확인하려면 다음처럼 강제할 수 있지만, 이 프로젝트의 전체 실기기 테스트에는 개발 빌드를 권장한다.

```powershell
pnpm.cmd --filter mobile start -- --go --lan --clear
```

## 7. 단계별 정상 여부 확인

1. PC 브라우저의 `/api/health`가 성공한다.
2. 휴대폰 브라우저의 `/api/health`가 성공한다.
3. 앱을 완전히 Reload한 뒤 사건 음성 입력/분석 화면을 진행한다.
4. `AI_MOCK_MODE=true`에서 다음 화면으로 이동하는지 확인한다.
5. 실제 AI 테스트가 필요하면 `AI_MOCK_MODE=false`로 바꾸고 PC의 Next.js 서버를 재시작한다.
6. PC 서버 터미널에서 `/api/cases/analyze`, `/api/cases` 요청과 상태 코드를 확인한다.

오류별 의미:

| 증상 | 확인할 항목 |
|---|---|
| `앱의 API 주소를 확인해 주세요` | `apps/mobile/.env.local`의 `EXPO_PUBLIC_API_BASE_URL`, Metro 재시작/Reload |
| `네트워크 연결을 확인...` | PC IP, 같은 Wi-Fi, Next 서버의 `0.0.0.0`, 방화벽, 휴대폰 `/api/health` |
| `분석 서비스를 현재 사용할 수 없습니다` | `AI_MOCK_MODE=false`인데 PC 서버에 `OPENAI_API_KEY`가 없거나 서버를 재시작하지 않음 |
| 분석 뒤 저장 단계에서 실패 | PostgreSQL 실행, migration, `DATABASE_URL` 일치 여부 |
| 음성 변환만 실패 | `ELEVENLABS_API_KEY`, 마이크 권한, `/api/stt/transcribe` 서버 로그 |
| QR/Metro 자체 연결 실패 | Metro의 `--lan`, TCP 8081 방화벽, 같은 Wi-Fi |

## 8. 테스트 종료

Next.js와 Metro 터미널은 `Ctrl+C`로 종료한다. PostgreSQL도 중지하려면 다음을 실행한다.

```powershell
docker compose -f infra/docker-compose.yml stop postgres
```

실기기 테스트가 끝난 뒤에도 API 키는 채팅, 화면 캡처, Git 커밋에 포함하지 않는다. 키가 노출되었다면 해당 서비스 콘솔에서 즉시 폐기하고 새 키를 발급한다.
