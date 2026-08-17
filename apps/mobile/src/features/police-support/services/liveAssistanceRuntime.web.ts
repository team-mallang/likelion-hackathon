import type { LiveAssistanceCore } from "@/features/police-support/services/liveAssistanceCore";

const WEB_ERROR =
  "실시간 현장 대응은 Android Development Build에서 사용할 수 있습니다.";

export function createLiveAssistanceRuntime(): LiveAssistanceCore {
  const listeners = new Set<Parameters<LiveAssistanceCore["subscribe"]>[0]>();

  return {
    async startSession() {
      throw new Error(WEB_ERROR);
    },
    async stopSession() {},
    async setMicrophoneEnabled() {
      throw new Error(WEB_ERROR);
    },
    async completeTurn() {
      throw new Error(WEB_ERROR);
    },
    getCredentials: () => null,
    getState: () => "IDLE",
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
