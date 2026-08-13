import { createAgoraRtmNativeClient } from "@/features/police-support/services/agoraRtmNativeClient";
import { createAgoraRtmTranscriptTransport } from "@/features/police-support/services/agoraRtmTranscriptTransport";
import { createNativeInterpreterEngine } from "@/features/police-support/services/interpreterEngine.native";
import { apiLiveAssistanceContextClient } from "@/features/police-support/services/liveAssistanceContext";
import { createLiveAssistanceCore } from "@/features/police-support/services/liveAssistanceCore";
import { apiLiveAssistanceSessionService } from "@/features/police-support/services/liveAssistanceSession";

export function createLiveAssistanceRuntime() {
  const transcriptTransport = createAgoraRtmTranscriptTransport(
    createAgoraRtmNativeClient(),
  );
  const interpreterEngine = createNativeInterpreterEngine({
    transcriptTransport,
  });

  return createLiveAssistanceCore({
    sessionService: apiLiveAssistanceSessionService,
    contextClient: apiLiveAssistanceContextClient,
    interpreterEngine,
  });
}
