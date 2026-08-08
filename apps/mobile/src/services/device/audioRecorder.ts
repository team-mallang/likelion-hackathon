import {
  getRecordingPermissionsAsync,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useCallback, useMemo, useRef } from "react";
import { Platform } from "react-native";

export type DevicePermissionStatus =
  | "undetermined"
  | "granted"
  | "denied";

export type DevicePermissionResult = {
  status: DevicePermissionStatus;
  canAskAgain: boolean;
};

export type ActiveRecording = {
  id: string;
  startedAt: string;
};

export type RecordedAudio = {
  uri: string;
  durationMs: number;
  mimeType?: string;
};

export type AudioRecorderStatus = {
  isRecording: boolean;
  durationMs: number;
};

export type AudioRecorder = {
  status: AudioRecorderStatus;
  getPermissionStatus: () => Promise<DevicePermissionResult>;
  requestPermission: () => Promise<DevicePermissionResult>;
  start: () => Promise<ActiveRecording>;
  stop: () => Promise<RecordedAudio>;
  cancel: () => Promise<void>;
  dispose: () => Promise<void>;
};

export type AudioRecorderErrorCode =
  | "PERMISSION_DENIED"
  | "ALREADY_RECORDING"
  | "NOT_RECORDING"
  | "START_FAILED"
  | "STOP_FAILED"
  | "DEVICE_UNAVAILABLE"
  | "UNKNOWN";

export class AudioRecorderError extends Error {
  constructor(
    public readonly code: AudioRecorderErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AudioRecorderError";
  }
}

function toDevicePermissionResult(
  result: Awaited<ReturnType<typeof getRecordingPermissionsAsync>>,
): DevicePermissionResult {
  const status: DevicePermissionStatus =
    result.status === "granted"
      ? "granted"
      : result.status === "denied"
        ? "denied"
        : "undetermined";

  return {
    status,
    canAskAgain: result.canAskAgain,
  };
}

function getRecordedAudioMimeType() {
  return Platform.OS === "web" ? "audio/webm" : "audio/mp4";
}

/**
 * Connects the app-level AudioRecorder contract to Expo Audio.
 *
 * This is a React hook because Expo owns the native recorder lifecycle through
 * useAudioRecorder. Screens should consume this adapter instead of importing
 * expo-audio directly.
 */
export function useExpoAudioRecorder(): AudioRecorder {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const activeRecordingRef = useRef<ActiveRecording | null>(null);

  const getPermissionStatus = useCallback(async () => {
    const result = await getRecordingPermissionsAsync();
    return toDevicePermissionResult(result);
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestRecordingPermissionsAsync();
    return toDevicePermissionResult(result);
  }, []);

  const start = useCallback(async (): Promise<ActiveRecording> => {
    if (activeRecordingRef.current || recorder.isRecording) {
      throw new AudioRecorderError(
        "ALREADY_RECORDING",
        "이미 음성을 녹음하고 있습니다.",
      );
    }

    const permission = await getRecordingPermissionsAsync();

    if (!permission.granted) {
      throw new AudioRecorderError(
        "PERMISSION_DENIED",
        "녹음을 시작하려면 마이크 권한이 필요합니다.",
      );
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();

      const activeRecording: ActiveRecording = {
        id: `expo-audio-${recorder.id}-${Date.now()}`,
        startedAt: new Date().toISOString(),
      };

      activeRecordingRef.current = activeRecording;
      return activeRecording;
    } catch (error) {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {
        // Preserve the original recording error.
      });

      throw new AudioRecorderError(
        "START_FAILED",
        "음성 녹음을 시작하지 못했습니다.",
        { cause: error },
      );
    }
  }, [recorder]);

  const stop = useCallback(async (): Promise<RecordedAudio> => {
    if (!activeRecordingRef.current) {
      throw new AudioRecorderError(
        "NOT_RECORDING",
        "현재 진행 중인 음성 녹음이 없습니다.",
      );
    }

    try {
      await recorder.stop();

      const status = recorder.getStatus();
      const uri = recorder.uri ?? status.url;

      if (!uri) {
        throw new Error("Expo Audio did not return a recording URI.");
      }

      return {
        uri,
        durationMs: status.durationMillis,
        mimeType: getRecordedAudioMimeType(),
      };
    } catch (error) {
      throw new AudioRecorderError(
        "STOP_FAILED",
        "음성 녹음을 종료하지 못했습니다.",
        { cause: error },
      );
    } finally {
      activeRecordingRef.current = null;
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {
        // Cleanup is best-effort after the recorder has stopped.
      });
    }
  }, [recorder]);

  const cancel = useCallback(async (): Promise<void> => {
    if (!activeRecordingRef.current) {
      return;
    }

    try {
      await recorder.stop();
    } catch (error) {
      throw new AudioRecorderError(
        "STOP_FAILED",
        "음성 녹음을 정리하지 못했습니다.",
        { cause: error },
      );
    } finally {
      activeRecordingRef.current = null;
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {
        // Cleanup is best-effort when a recording is discarded.
      });
    }
  }, [recorder]);

  const dispose = useCallback(async (): Promise<void> => {
    await cancel();
    await setAudioModeAsync({ allowsRecording: false });
  }, [cancel]);

  return useMemo(
    () => ({
      status: {
        isRecording: recorderState.isRecording,
        durationMs: recorderState.durationMillis,
      },
      getPermissionStatus,
      requestPermission,
      start,
      stop,
      cancel,
      dispose,
    }),
    [
      cancel,
      dispose,
      getPermissionStatus,
      requestPermission,
      recorderState.durationMillis,
      recorderState.isRecording,
      start,
      stop,
    ],
  );
}
