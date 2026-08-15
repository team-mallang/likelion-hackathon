import { useRouter, type Href } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { Alert, AppState, Linking } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { documentsNavigationState } from "@/features/documents/services/documentsNavigation";
import {
  InterpreterEngineError,
  type InterpreterConnectionState,
  type InterpreterEvent,
} from "@/features/police-support/services/interpreterEngine";
import type { LiveAssistanceContextResult } from "@/features/police-support/services/liveAssistanceContext";
import type { LiveAssistanceCoreEvent } from "@/features/police-support/services/liveAssistanceCore";
import { createLiveAssistanceRuntime } from "@/features/police-support/services/liveAssistanceRuntime";
import { createMockPoliceSupportService } from "@/features/police-support/services/mockPoliceSupport";
import { PoliceSupportServiceError } from "@/features/police-support/services/policeSupport";
import type {
  InterpreterSessionCredentials,
  PoliceSupportOverview,
  SpeakerRole,
} from "@/features/police-support/types/policeSupport";
import {
  getInterpreterLanguages,
  initialInterpreterConversationState,
  interpreterConversationReducer,
} from "@/features/police-support/utils/interpreterConversation";
import { PoliceSupportView } from "@/features/police-support/views/PoliceSupportView";
import type {
  PoliceReportActionStatus,
  PoliceSupportMicrophoneStatus,
} from "@/features/police-support/views/PoliceSupportView.types";
import { microphonePermission } from "@/services/device/microphonePermission";

function createTurnId() {
  return `turn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PoliceSupportScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  // The overview API does not exist yet. Only this presentation data remains
  // mocked; session, RTC/RTM, transcript, and Context all use real services.
  const overviewService = useMemo(
    () => createMockPoliceSupportService(),
    [activeCase?.caseId],
  );
  const liveAssistanceCore = useMemo(() => createLiveAssistanceRuntime(), []);
  const [conversation, dispatchConversation] = useReducer(
    interpreterConversationReducer,
    initialInterpreterConversationState,
  );
  const [overview, setOverview] = useState<PoliceSupportOverview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(activeCase));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLargeText, setIsLargeText] = useState(false);
  const [hasAcceptedVoiceProcessing, setHasAcceptedVoiceProcessing] =
    useState(false);
  const [hasConfirmedOfficerNotice, setHasConfirmedOfficerNotice] =
    useState(false);
  const [activeSpeakerRole, setActiveSpeakerRole] =
    useState<SpeakerRole>("TRAVELER");
  const [sessionStatus, setSessionStatus] =
    useState<InterpreterConnectionState>("DISCONNECTED");
  const [microphoneStatus, setMicrophoneStatus] =
    useState<PoliceSupportMicrophoneStatus>("IDLE");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [permissionErrorMessage, setPermissionErrorMessage] = useState<
    string | null
  >(null);
  const [connectionErrorMessage, setConnectionErrorMessage] = useState<
    string | null
  >(null);
  const [reportDraftStatus, setReportDraftStatus] =
    useState<PoliceReportActionStatus>("NONE");
  const [reportDraftErrorMessage, setReportDraftErrorMessage] = useState<
    string | null
  >(null);
  const [contextResult, setContextResult] =
    useState<LiveAssistanceContextResult | null>(null);

  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const lifecycleIdRef = useRef(0);
  const operationInFlightRef = useRef(false);
  const credentialsRef = useRef<InterpreterSessionCredentials | null>(null);
  const activeTurnIdRef = useRef<string | null>(null);
  const completedTurnIdsRef = useRef(new Set<string>());
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const handleEngineEvent = useCallback((event: InterpreterEvent) => {
    if (!mountedRef.current) {
      return;
    }

    if (event.type === "CONNECTION_STATE_CHANGED") {
      setSessionStatus(event.state);

      if (event.state === "FAILED" || event.state === "DISCONNECTED") {
        setConnectionErrorMessage(
          "실시간 통역 연결이 끊어졌습니다. 다시 연결해 주세요.",
        );
        setMicrophoneStatus("INTERRUPTED");
        setIsTranscribing(false);
        setIsTranslating(false);
      }

      return;
    }

    if (
      "turnId" in event &&
      event.turnId &&
      completedTurnIdsRef.current.has(event.turnId)
    ) {
      return;
    }

    dispatchConversation({ type: "ENGINE_EVENT", event });

    if (event.type === "TRANSCRIPT_FINAL") {
      setIsTranscribing(false);
      setIsTranslating(true);
      return;
    }

    if (event.type === "TRANSLATION_FINAL") {
      completedTurnIdsRef.current.add(event.turnId);
      setIsTranslating(false);
      setMicrophoneStatus("IDLE");
      return;
    }

    if (event.type === "ERROR" && event.turnId) {
      setIsTranscribing(false);
      setIsTranslating(false);
      setMicrophoneStatus(
        event.code === "TRANSLATION_FAILED" ? "IDLE" : "INTERRUPTED",
      );
    }
  }, []);

  const handleLiveAssistanceEvent = useCallback(
    (event: LiveAssistanceCoreEvent) => {
      if (!mountedRef.current) return;

      if (event.type === "ENGINE_EVENT") {
        handleEngineEvent(event.event);
        return;
      }

      if (event.type === "CONTEXT_PROCESSING") {
        setIsTranscribing(false);
        setIsTranslating(true);
        return;
      }

      if (event.type === "CONTEXT_RESULT") {
        completedTurnIdsRef.current.add(event.turnId);
        setContextResult(event.result);
        setIsTranslating(false);
        setMicrophoneStatus("IDLE");
        return;
      }

      if (event.type === "ERROR") {
        setConnectionErrorMessage(
          event.code === "CONTEXT_PROCESSING_FAILED"
            ? "사건 정보를 바탕으로 대응 도움을 만들지 못했습니다. 다시 시도해 주세요."
            : "실시간 현장 대응 연결에 문제가 발생했습니다. 다시 연결해 주세요.",
        );
        setIsTranscribing(false);
        setIsTranslating(false);
        setMicrophoneStatus("INTERRUPTED");
      }
    },
    [handleEngineEvent],
  );

  const ensureSubscribed = useCallback(() => {
    if (!unsubscribeRef.current) {
      unsubscribeRef.current = liveAssistanceCore.subscribe(
        handleLiveAssistanceEvent,
      );
    }
  }, [handleLiveAssistanceEvent, liveAssistanceCore]);

  const closeSession = useCallback(
    async (
      showCloseError = false,
      finalMicrophoneStatus: PoliceSupportMicrophoneStatus = "IDLE",
    ) => {
      const cleanupLifecycleId = ++lifecycleIdRef.current;
      operationInFlightRef.current = false;
      activeTurnIdRef.current = null;

      const unsubscribe = unsubscribeRef.current;
      unsubscribeRef.current = null;
      unsubscribe?.();

      const credentials = credentialsRef.current;
      credentialsRef.current = null;

      if (credentials) {
        try {
          await liveAssistanceCore.stopSession();
        } catch (error) {
          if (showCloseError && mountedRef.current) {
            setConnectionErrorMessage(
              safePoliceSupportError(
                error,
                "통역 세션을 정상적으로 종료하지 못했습니다.",
              ),
            );
          }
        }
      }

      if (
        mountedRef.current &&
        cleanupLifecycleId === lifecycleIdRef.current
      ) {
        setSessionStatus("DISCONNECTED");
        setMicrophoneStatus(finalMicrophoneStatus);
        setIsTranscribing(false);
        setIsTranslating(false);
      }
    }, [liveAssistanceCore]);

  const loadOverview = useCallback(async () => {
    if (!activeCase) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await overviewService.getOverview({
        caseId: activeCase.caseId,
        accessToken: activeCase.accessToken,
      });

      if (requestId === requestIdRef.current && mountedRef.current) {
        setOverview(result);
        setReportDraftStatus(result.reportDraft ? "READY" : "NONE");
      }
    } catch (error) {
      if (requestId === requestIdRef.current && mountedRef.current) {
        setOverview(null);
        setErrorMessage(
          safePoliceSupportError(
            error,
            "경찰 지원 내용을 준비하지 못했습니다. 다시 시도해 주세요.",
          ),
        );
      }
    } finally {
      if (requestId === requestIdRef.current && mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeCase, overviewService]);

  useEffect(() => {
    mountedRef.current = true;
    lifecycleIdRef.current += 1;

    if (!activeCase) {
      setOverview(null);
      setIsLoading(false);
      return;
    }

    dispatchConversation({ type: "CLEAR" });
    completedTurnIdsRef.current.clear();
    setContextResult(null);
    setHasAcceptedVoiceProcessing(false);
    setHasConfirmedOfficerNotice(false);
    void loadOverview();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      void closeSession();
    };
  }, [activeCase, closeSession, loadOverview]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        nextState === "active" ||
        (!credentialsRef.current && !operationInFlightRef.current)
      ) {
        return;
      }

      if (mountedRef.current) {
        setMicrophoneStatus("INTERRUPTED");
        setConnectionErrorMessage(
          "앱이 백그라운드로 이동하여 통역을 중지했습니다. 다시 연결해 주세요.",
        );
      }

      void closeSession(false, "INTERRUPTED");
    });

    return () => subscription.remove();
  }, [closeSession]);

  if (!activeCase) {
    return (
      <AppScreen
        footer={
          <Button title="홈으로 돌아가기" onPress={() => router.replace("/")} />
        }
        scroll={false}
      >
        <ErrorState message="활성 사건이 없습니다. 사건을 먼저 저장해 주세요." />
      </AppScreen>
    );
  }

  const currentCase = activeCase;

  async function ensureMicrophonePermission(lifecycleId: number) {
    setMicrophoneStatus("REQUESTING_PERMISSION");
    setPermissionErrorMessage(null);

    try {
      let permission = await microphonePermission.getStatus();

      if (permission.status !== "granted") {
        permission = await microphonePermission.request();
      }

      if (lifecycleId !== lifecycleIdRef.current || !mountedRef.current) {
        return false;
      }

      if (permission.status === "granted") {
        return true;
      }

      setMicrophoneStatus("IDLE");
      setPermissionErrorMessage(
        permission.canAskAgain
          ? "실시간 통역을 사용하려면 마이크 권한이 필요합니다."
          : "마이크 권한이 꺼져 있습니다. 기기 설정에서 권한을 허용해 주세요.",
      );
      return false;
    } catch {
      if (lifecycleId !== lifecycleIdRef.current || !mountedRef.current) {
        return false;
      }

      setMicrophoneStatus("IDLE");
      setPermissionErrorMessage(
        "마이크 권한을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      return false;
    }
  }

  async function connectSession(lifecycleId: number) {
    if (lifecycleId !== lifecycleIdRef.current || !mountedRef.current) {
      return null;
    }

    setConnectionErrorMessage(null);

    if (!currentCase.accessToken) {
      throw new PoliceSupportServiceError(
        "AUTHENTICATION_REQUIRED",
        "사건 접근 인증이 필요합니다.",
      );
    }

    let credentials = credentialsRef.current;

    if (!credentials || new Date(credentials.expiresAt).getTime() <= Date.now()) {
      ensureSubscribed();
      credentials = await liveAssistanceCore.startSession({
        caseId: currentCase.caseId,
        accessToken: currentCase.accessToken,
      });
    }

    if (lifecycleId !== lifecycleIdRef.current || !mountedRef.current) {
      await liveAssistanceCore.stopSession().catch(() => {});
      return null;
    }

    credentialsRef.current = credentials;
    return credentials;
  }

  async function startTurn() {
    if (operationInFlightRef.current || activeTurnIdRef.current) {
      return;
    }

    if (!hasAcceptedVoiceProcessing || !hasConfirmedOfficerNotice) {
      setMicrophoneStatus("IDLE");
      setPermissionErrorMessage(
        "통역을 시작하기 전에 음성 처리 안내와 경찰관 고지 확인을 완료해 주세요.",
      );
      return;
    }

    operationInFlightRef.current = true;
    const lifecycleId = ++lifecycleIdRef.current;

    try {
      if (!(await ensureMicrophonePermission(lifecycleId))) {
        return;
      }

      let credentials = credentialsRef.current;

      if (sessionStatus !== "CONNECTED" || !credentials) {
        credentials = await connectSession(lifecycleId);
      }

      if (
        !credentials ||
        lifecycleId !== lifecycleIdRef.current ||
        !mountedRef.current
      ) {
        return;
      }

      const turnId = createTurnId();
      const languages = getInterpreterLanguages(activeSpeakerRole);
      activeTurnIdRef.current = turnId;
      dispatchConversation({
        type: "BEGIN_TURN",
        sessionId: credentials.sessionId,
        input: { turnId, speakerRole: activeSpeakerRole, ...languages },
      });
      await liveAssistanceCore.setMicrophoneEnabled({
        enabled: true,
        turn: { turnId, speakerRole: activeSpeakerRole, ...languages },
      });

      if (lifecycleId !== lifecycleIdRef.current || !mountedRef.current) {
        return;
      }

      setMicrophoneStatus("LISTENING");
      setIsTranscribing(true);
      setIsTranslating(false);
    } catch (error) {
      activeTurnIdRef.current = null;
      setMicrophoneStatus("INTERRUPTED");
      setIsTranscribing(false);
      setIsTranslating(false);
      setConnectionErrorMessage(
        safePoliceSupportError(
          error,
          "실시간 통역을 시작하지 못했습니다. 다시 시도해 주세요.",
        ),
      );
    } finally {
      operationInFlightRef.current = false;
    }
  }

  async function stopTurn() {
    if (operationInFlightRef.current || !activeTurnIdRef.current) {
      return;
    }

    operationInFlightRef.current = true;
    setMicrophoneStatus("PROCESSING");

    try {
      await liveAssistanceCore.setMicrophoneEnabled({ enabled: false });
      activeTurnIdRef.current = null;
    } catch (error) {
      activeTurnIdRef.current = null;
      setMicrophoneStatus("INTERRUPTED");
      setIsTranscribing(false);
      setIsTranslating(false);
      setConnectionErrorMessage(
        safePoliceSupportError(
          error,
          "발화를 종료하지 못했습니다. 다시 연결해 주세요.",
        ),
      );
    } finally {
      operationInFlightRef.current = false;
    }
  }

  async function handleMicrophone() {
    if (microphoneStatus === "LISTENING") {
      await stopTurn();
      return;
    }

    if (
      microphoneStatus === "REQUESTING_PERMISSION" ||
      microphoneStatus === "PROCESSING"
    ) {
      return;
    }

    await startTurn();
  }

  async function navigateAfterCleanup(destination: Href | "BACK") {
    await closeSession(true);

    if (destination === "BACK") {
      router.back();
      return;
    }

    router.replace(destination);
  }

  async function handleOpenReport() {
    if (reportDraftStatus === "GENERATING") {
      return;
    }

    setReportDraftStatus(overview?.reportDraft ? "READY" : "GENERATING");
    setReportDraftErrorMessage(null);

    try {
      await closeSession(true);
      documentsNavigationState.setReturnTarget("POLICE_SUPPORT");
      router.replace("/case/report" as Href);
    } catch {
      setReportDraftStatus("FAILED");
      setReportDraftErrorMessage(
        "신고서 초안 화면을 열지 못했습니다. 다시 시도해 주세요.",
      );
    }
  }

  async function handleOpenPermissionSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setPermissionErrorMessage(
        "기기 설정을 열지 못했습니다. 설정 앱에서 마이크 권한을 허용해 주세요.",
      );
    }
  }

  function handleSuggestion(suggestionId: string) {
    const suggestion = overview?.suggestions.find(
      (item) => item.id === suggestionId,
    );

    if (suggestion?.actionType === "OPEN_REPORT") {
      void handleOpenReport();
      return;
    }

    Alert.alert(
      "경찰관에게 보여주세요",
      suggestion?.message ?? "현재 사건 정보를 다시 확인해 주세요.",
    );
  }

  return (
    <PoliceSupportView
      activeSpeakerRole={activeSpeakerRole}
      connectionErrorMessage={connectionErrorMessage}
      errorMessage={errorMessage}
      isLargeText={isLargeText}
      isLoading={isLoading}
      isTranscribing={isTranscribing}
      isTranslating={isTranslating}
      hasAcceptedVoiceProcessing={hasAcceptedVoiceProcessing}
      hasConfirmedOfficerNotice={hasConfirmedOfficerNotice}
      microphoneStatus={microphoneStatus}
      onBack={() => void navigateAfterCleanup("BACK")}
      onCaseTab={() => {}}
      onCreateOrOpenReport={() => void handleOpenReport()}
      onDocumentsTab={() => {
        documentsNavigationState.setReturnTarget("POLICE_SUPPORT");
        void navigateAfterCleanup("/case/documents" as Href);
      }}
      onGuideTab={() => void navigateAfterCleanup("/case/guides" as Href)}
      onOpenPermissionSettings={() => void handleOpenPermissionSettings()}
      onPressMicrophone={() => void handleMicrophone()}
      onRetryConnection={() => void startTurn()}
      onRetryOverview={() => void loadOverview()}
      onSetOfficerNoticeConfirmed={setHasConfirmedOfficerNotice}
      onSetVoiceProcessingConsent={setHasAcceptedVoiceProcessing}
      onRetryTranslation={(turnId) => {
        dispatchConversation({ type: "RETRY_TRANSLATION", turnId });
        Alert.alert(
          "번역 다시 시도",
          "번역 재요청 API는 실제 Agora 연결 단계에서 연결됩니다.",
        );
      }}
      onRunSuggestion={handleSuggestion}
      onSelectSpeaker={setActiveSpeakerRole}
      onToggleLargeText={() => setIsLargeText((current) => !current)}
      overview={
        overview && contextResult
          ? {
              ...overview,
              suggestions: [
                {
                  id: "live-context-result",
                  message: contextResult.incidentHelp,
                  actionType: "NONE",
                },
                ...overview.suggestions.filter(
                  (item) => item.id !== "live-context-result",
                ),
              ],
            }
          : overview
      }
      permissionErrorMessage={permissionErrorMessage}
      reportDraftErrorMessage={reportDraftErrorMessage}
      reportDraftStatus={reportDraftStatus}
      sessionStatus={sessionStatus}
      turns={conversation.turns}
    />
  );
}

function safePoliceSupportError(error: unknown, fallback: string) {
  if (error instanceof InterpreterEngineError) {
    return "실시간 통역 연결을 완료하지 못했습니다. 다시 연결해 주세요.";
  }

  if (error instanceof PoliceSupportServiceError) {
    return error.code === "AUTHENTICATION_REQUIRED"
      ? "통역 세션을 확인할 수 없습니다. 사건 화면에서 다시 시작해 주세요."
      : fallback;
  }

  return fallback;
}
