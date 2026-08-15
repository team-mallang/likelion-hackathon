export type RecordingState =
  | "idle"
  | "requestingPermission"
  | "recording"
  | "stopping"
  | "processing"
  | "error";

export type LocationState =
  | "idle"
  | "requestingPermission"
  | "loading"
  | "success"
  | "error";

export type VoiceInputViewProps = {
  statement: string;
  inputMode: "voice" | "text";
  recordingState: RecordingState;
  recordingTimeLabel: string;
  locationText: string;
  localTimeText: string;
  locationState: LocationState;
  isLocationEditorOpen: boolean;
  locationErrorMessage: string | null;
  canOpenLocationSettings: boolean;
  errorMessage: string | null;
  canOpenSettings: boolean;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  onInputModeChange: (mode: "voice" | "text") => void;
  onLocationTextChange: (value: string) => void;
  onLocationEditorToggle: () => void;
  onOpenSettings: () => void;
  onOpenLocationSettings: () => void;
  onOccurredAtTextChange: (value: string) => void;
  onRecordAgain: () => void;
  onRecordStart: () => void;
  onRecordStop: () => void;
  onStatementChange: (value: string) => void;
  onUseCurrentLocation: () => void;
  onUseCurrentTime: () => void;
};
