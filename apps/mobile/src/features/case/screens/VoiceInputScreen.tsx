import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Linking } from "react-native";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { CaseFlowError } from "@/features/case/services/caseFlow";
import { transcribeCaseAudio } from "@/features/case/services/caseStt";
import { VoiceInputView } from "@/features/case/views/VoiceInputView";
import type {
  LocationState,
  RecordingState,
} from "@/features/case/views/VoiceInputView.types";
import {
  AudioRecorderError,
  type RecordedAudio,
  useExpoAudioRecorder,
} from "@/services/device/audioRecorder";
import { deleteRecordedAudio } from "@/services/device/audioFile";
import {
  expoLocationService,
  LocationError,
} from "@/services/device/location";

type VoiceInputError = {
  kind: "permissionDenied" | "recording" | "transcription";
  message: string;
  canOpenSettings?: boolean;
};

type LocationInputError = {
  message: string;
  canOpenSettings?: boolean;
};

function formatRecordingTime(elapsedSeconds: number) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function VoiceInputScreen() {
  const router = useRouter();
  const { draft, updateDraft, resetStatementAnalysis } = useCaseDraft();
  const audioRecorder = useExpoAudioRecorder();
  const recordedAudioRef = useRef<RecordedAudio | null>(null);
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");
  const [voiceInputError, setVoiceInputError] =
    useState<VoiceInputError | null>(null);
  const [locationState, setLocationState] =
    useState<LocationState>("idle");
  const [isLocationEditorOpen, setIsLocationEditorOpen] =
    useState(false);
  const [locationError, setLocationError] =
    useState<LocationInputError | null>(null);
  const recordingStateRef = useRef(recordingState);
  const locationRequestIdRef = useRef(0);
  const locationRequestInFlightRef = useRef(false);
  const transcriptionInFlightRef = useRef(false);

  recordingStateRef.current = recordingState;

  const recordingTimeLabel = formatRecordingTime(
    Math.floor(audioRecorder.status.durationMs / 1000),
  );

  async function discardCompletedRecording() {
    const recordedAudio = recordedAudioRef.current;
    recordedAudioRef.current = null;

    if (!recordedAudio) return;

    await deleteRecordedAudio(recordedAudio.uri).catch(() => {
      // Cleanup is best-effort. Never expose a local recording URI in logs/UI.
    });
  }

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          return;
        }

        const wasRecording =
          recordingStateRef.current === "recording";

        if (!wasRecording) {
          return;
        }

        void audioRecorder.cancel().then(
          () => {
            if (wasRecording) {
              setRecordingState("error");
              setVoiceInputError({
                kind: "recording",
                message:
                  "앱이 백그라운드로 이동하여 녹음을 종료했습니다. 다시 녹음해 주세요.",
              });
            }
          },
          () => {
            if (wasRecording) {
              setRecordingState("error");
              setVoiceInputError({
                kind: "recording",
                message:
                  "백그라운드 전환 중 녹음을 정리하지 못했습니다. 다시 녹음해 주세요.",
              });
            }
          },
        );
      },
    );

    return () => {
      subscription.remove();
      void discardCompletedRecording();
      void audioRecorder.dispose().catch(() => {
        // The screen is already unmounting, so cleanup remains best-effort.
      });
    };
  }, [audioRecorder.cancel, audioRecorder.dispose]);

  async function beginRecording() {
    setVoiceInputError(null);
    await discardCompletedRecording();
    setRecordingState("requestingPermission");

    try {
      let permission = await audioRecorder.getPermissionStatus();

      if (permission.status !== "granted") {
        permission = await audioRecorder.requestPermission();
      }

      if (permission.status !== "granted") {
        setRecordingState("error");
        setVoiceInputError({
          kind: "permissionDenied",
          message: permission.canAskAgain
            ? "음성 입력을 사용하려면 마이크 권한이 필요합니다. 다시 시도하거나 텍스트로 입력해 주세요."
            : "마이크 권한이 꺼져 있습니다. 기기 설정에서 권한을 허용하거나 텍스트로 입력해 주세요.",
          canOpenSettings: !permission.canAskAgain,
        });
        return;
      }

      await audioRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      if (
        error instanceof AudioRecorderError &&
        error.code === "ALREADY_RECORDING"
      ) {
        setRecordingState("recording");
        return;
      }

      const permissionDenied =
        error instanceof AudioRecorderError &&
        error.code === "PERMISSION_DENIED";

      setRecordingState("error");
      setVoiceInputError({
        kind: permissionDenied ? "permissionDenied" : "recording",
        message: permissionDenied
          ? "음성 입력을 사용하려면 마이크 권한이 필요합니다."
          : "음성 녹음을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  async function handleRecordStart() {
    if (
      recordingState === "requestingPermission" ||
      recordingState === "recording" ||
      recordingState === "stopping" ||
      recordingState === "processing"
    ) {
      return;
    }

    await beginRecording();
  }

  async function handleBack() {
    if (recordingState === "stopping" || recordingState === "processing") {
      return;
    }

    if (recordingState === "recording") {
      await audioRecorder.cancel().catch(() => {
        // Navigation should not be blocked when recorder cleanup fails.
      });
      setRecordingState("idle");
    }

    await discardCompletedRecording();
    router.back();
  }

  function handleContinue() {
    const isRecordingBusy =
      recordingState === "requestingPermission" ||
      recordingState === "recording" ||
      recordingState === "stopping" ||
      recordingState === "processing" ||
      audioRecorder.status.isRecording;
    const isLocationBusy =
      locationState === "requestingPermission" ||
      locationState === "loading";

    if (
      !draft.initialStatement.trim() ||
      isRecordingBusy ||
      isLocationBusy
    ) {
      return;
    }

    router.push("/case/review" as Href);
  }

  async function handleInputModeChange(mode: "voice" | "text") {
    if (mode === draft.inputMode) {
      return;
    }

    const shouldCancelRecording =
      mode === "text" &&
      (recordingState === "recording" ||
        audioRecorder.status.isRecording);

    if (shouldCancelRecording) {
      setRecordingState("stopping");

      try {
        await audioRecorder.cancel();
      } catch {
        setRecordingState("error");
        setVoiceInputError({
          kind: "recording",
          message:
            "녹음을 정리하지 못해 텍스트 입력으로 전환할 수 없습니다. 다시 시도해 주세요.",
        });
        return;
      }
    }

    await discardCompletedRecording();
    setVoiceInputError(null);
    setRecordingState("idle");
    updateDraft({
      inputMode: mode,
    });
  }

  async function handleRecordAgain() {
    if (
      recordingState === "requestingPermission" ||
      recordingState === "stopping" ||
      recordingState === "processing"
    ) {
      return;
    }

    if (
      recordingState === "recording" ||
      audioRecorder.status.isRecording
    ) {
      setRecordingState("stopping");

      try {
        await audioRecorder.cancel();
      } catch {
        setRecordingState("error");
        setVoiceInputError({
          kind: "recording",
          message:
            "기존 녹음을 정리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        });
        return;
      }
    }

    await discardCompletedRecording();
    setVoiceInputError(null);
    updateDraft({ initialStatement: "" });
    resetStatementAnalysis();
    await beginRecording();
  }

  async function handleOpenSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setRecordingState("error");
      setVoiceInputError({
        kind: "permissionDenied",
        message:
          "기기 설정을 열지 못했습니다. 설정 앱에서 Travel Guard의 마이크 권한을 허용해 주세요.",
        canOpenSettings: true,
      });
    }
  }

  async function handleUseCurrentLocation() {
    if (
      locationRequestInFlightRef.current ||
      locationState === "requestingPermission" ||
      locationState === "loading"
    ) {
      return;
    }

    locationRequestInFlightRef.current = true;
    const requestId = ++locationRequestIdRef.current;
    setLocationError(null);
    setLocationState("requestingPermission");

    try {
      let permission =
        await expoLocationService.getPermissionStatus();

      if (permission.status !== "granted") {
        permission = await expoLocationService.requestPermission();
      }

      if (permission.status !== "granted") {
        setIsLocationEditorOpen(true);
        setLocationState("error");
        setLocationError({
          message: permission.canAskAgain
            ? "현재 위치를 사용하려면 위치 권한이 필요합니다. 다시 시도하거나 장소를 직접 입력해 주세요."
            : "위치 권한이 꺼져 있습니다. 기기 설정에서 권한을 허용하거나 장소를 직접 입력해 주세요.",
          canOpenSettings: !permission.canAskAgain,
        });
        return;
      }

      setLocationState("loading");

      const currentLocation =
        await expoLocationService.getCurrentLocation();

      if (requestId !== locationRequestIdRef.current) {
        return;
      }

      const coordinates = {
        ...currentLocation.coordinates,
        capturedAt: currentLocation.capturedAt,
      };

      const locationText =
        await expoLocationService.formatLocation(currentLocation);

      if (requestId !== locationRequestIdRef.current) {
        return;
      }

      updateDraft({
        lastSeenPlace: locationText,
        coordinates,
      });
      resetStatementAnalysis();
      setIsLocationEditorOpen(false);
      setLocationState("success");
    } catch (error) {
      if (requestId !== locationRequestIdRef.current) {
        return;
      }

      const permissionDenied =
        error instanceof LocationError &&
        error.code === "PERMISSION_DENIED";
      const message =
        error instanceof LocationError
          ? error.message
          : "현재 위치를 확인하지 못했습니다.";

      setLocationState("error");
      setIsLocationEditorOpen(true);
      setLocationError({
        message: permissionDenied
          ? `${message} 장소를 직접 입력해 주세요.`
          : `${message} 장소를 직접 입력하거나 다시 시도해 주세요.`,
      });
    } finally {
      locationRequestInFlightRef.current = false;
    }
  }

  function handleLocationTextChange(value: string) {
    locationRequestIdRef.current += 1;
    setLocationError(null);
    setLocationState("idle");
    updateDraft({
      lastSeenPlace: value || null,
      coordinates: null,
    });
    resetStatementAnalysis();
  }

  function handleOccurredAtTextChange(value: string) {
    updateDraft({ lastSeenAt: value || null });
    resetStatementAnalysis();
  }

  async function handleOpenLocationSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setLocationState("error");
      setLocationError({
        message:
          "기기 설정을 열지 못했습니다. 설정 앱에서 Travel Guard의 위치 권한을 허용하거나 장소를 직접 입력해 주세요.",
        canOpenSettings: true,
      });
    }
  }

  async function handleRecordStop() {
    if (recordingState !== "recording" || transcriptionInFlightRef.current) {
      return;
    }

    transcriptionInFlightRef.current = true;
    setVoiceInputError(null);
    setRecordingState("stopping");

    let recordedAudio: RecordedAudio;

    try {
      recordedAudio = await audioRecorder.stop();
    } catch (error) {
      const noActiveRecording =
        error instanceof AudioRecorderError &&
        error.code === "NOT_RECORDING";

      setRecordingState("error");
      setVoiceInputError({
        kind: "recording",
        message: noActiveRecording
          ? "진행 중인 녹음을 찾지 못했습니다. 다시 녹음해 주세요."
          : "음성 녹음을 종료하지 못했습니다. 다시 시도해 주세요.",
      });
      transcriptionInFlightRef.current = false;
      return;
    }

    recordedAudioRef.current = recordedAudio;
    setRecordingState("processing");

    try {
      const result = await transcribeCaseAudio({
        uri: recordedAudio.uri,
        mimeType: recordedAudio.mimeType,
        durationMs: recordedAudio.durationMs,
      });

      updateDraft({
        initialStatement: result.statement,
        errorMessage: null,
      });
      resetStatementAnalysis();

      setRecordingState("idle");
    } catch (error) {
      const message =
        error instanceof CaseFlowError
          ? error.message
          : "음성을 문장으로 변환하지 못했습니다.";

      setRecordingState("error");
      setVoiceInputError({
        kind: "transcription",
        message: `${message} 다시 녹음해 주세요.`,
      });
    } finally {
      await discardCompletedRecording();
      transcriptionInFlightRef.current = false;
    }
  }

  function handleStatementChange(value: string) {
  updateDraft({
    initialStatement: value,
    errorMessage: null,
  });
  resetStatementAnalysis();
}

  return (
    <VoiceInputView
      statement={draft.initialStatement}
      inputMode={draft.inputMode}
      recordingState={recordingState}
      recordingTimeLabel={recordingTimeLabel}
      locationText={draft.lastSeenPlace ?? ""}
      localTimeText={draft.lastSeenAt ?? ""}
      locationState={locationState}
      isLocationEditorOpen={isLocationEditorOpen}
      locationErrorMessage={locationError?.message ?? null}
      canOpenLocationSettings={
        locationError?.canOpenSettings ?? false
      }
      errorMessage={voiceInputError?.message ?? draft.errorMessage}
      canOpenSettings={voiceInputError?.canOpenSettings ?? false}
      canContinue={
        draft.initialStatement.trim().length > 0 &&
        recordingState !== "processing"
      }
      onBack={handleBack}
      onContinue={handleContinue}
      onInputModeChange={handleInputModeChange}
      onLocationTextChange={handleLocationTextChange}
      onLocationEditorToggle={() =>
        setIsLocationEditorOpen((current) => !current)
      }
      onOpenSettings={handleOpenSettings}
      onOpenLocationSettings={handleOpenLocationSettings}
      onOccurredAtTextChange={handleOccurredAtTextChange}
      onRecordAgain={handleRecordAgain}
      onRecordStart={handleRecordStart}
      onRecordStop={handleRecordStop}
      onStatementChange={handleStatementChange}
      onUseCurrentLocation={handleUseCurrentLocation}
    />
  );
}
