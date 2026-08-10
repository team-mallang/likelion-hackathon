import { caseDraftFixture } from "@/mocks/caseDraftFixture";

import { CaseFlowError, type CaseFlow } from "./caseFlow";

export type MockCaseFlowOptions = {
  delayMs?: number;
  failTranscription?: boolean;
};

const DEFAULT_DELAY_MS = 300;

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, delayMs));
  });
}

export function createMockCaseFlow(
  options: MockCaseFlowOptions = {},
): CaseFlow {
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;

  return {
    async transcribeAudio(input) {
      await wait(delayMs);

      if (!input.uri.trim()) {
        throw new CaseFlowError(
          "INVALID_INPUT",
          "처리할 음성 파일이 없습니다.",
        );
      }

      if (options.failTranscription) {
        throw new CaseFlowError(
          "TRANSCRIPTION_FAILED",
          "음성을 문장으로 변환하지 못했습니다.",
        );
      }

      return { statement: caseDraftFixture.initialStatement };
    },
  };
}

export const mockCaseFlow = createMockCaseFlow();
