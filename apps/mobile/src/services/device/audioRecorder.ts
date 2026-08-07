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

export type AudioRecorder = {
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
