# Android Live Assistance device test

This guide verifies the Android-native RTM bridge. It does not replace the
working Chrome `/agora-poc` diagnostic page.

## Prepare

1. Check out the feature branch and run `corepack pnpm install` at the repo root.
2. Set server-only secrets for the web/backend process: `DATABASE_URL`, `AUTH_SECRET`, `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, `AGORA_CUSTOMER_ID`, `AGORA_CUSTOMER_SECRET`, `OPENAI_API_KEY`, and optionally `OPENAI_MODEL`.
3. Set `EXPO_PUBLIC_API_BASE_URL` in `apps/mobile/.env` to a phone-reachable backend URL. Do not use `localhost` and do not add Agora or OpenAI secrets here.
4. Build/install an Android Development Build after prebuild. Expo Go cannot load this native RTM module.

## Verify

1. Start the backend/web server with the server secrets.
2. Start Metro for the Development Build.
3. Create or open a real Case, then enter the police-support flow once the UI binds `LiveAssistanceCore`.
4. Confirm in order: session API succeeds, RTC connects, ConvoAI Agent starts, RTM connects, then microphone is enabled.
5. Say: `지갑 색상은 무엇입니까?`
   - Expected: ARES partial/final user transcript arrives through `AgoraRtmMessage`; the final event reaches Context; mode is `RULE`.
6. Say: `경찰에게 어떤 내용을 먼저 설명하면 좋을까요?`
   - Expected: final user transcript reaches Context; mode is `OPENAI`.
7. End the session. Confirm RTM unsubscribe/logout/destroy, RTC disconnect, and server session DELETE occur.

## Success criteria

All of the following are required before declaring Android live assistance verified:

- session API and RTC connect
- ConvoAI Agent started
- RTM subscription connected
- actual microphone speech produces ARES partial and final user transcript
- agent messages do not call Context
- a duplicate final does not create a second Context request
- both RULE and OPENAI responses return
- stop cleanup completes

If Chrome PoC works but any Android step fails, keep `/agora-poc` intact and
diagnose the Android native bridge separately.
