export type RecordingState =
  | "idle"
  | "requestingPermission"
  | "recording"
  | "stopping"
  | "processing"
  | "error";

export type VoiceInputViewProps = {
  statement: string;
  inputMode: "voice" | "text";
  recordingState: RecordingState;
  recordingTimeLabel: string;
  locationText: string;
  localTimeText: string;
  errorMessage: string | null;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
  onInputModeChange: (mode: "voice" | "text") => void;
  onRecordAgain: () => void;
  onRecordStart: () => void;
  onRecordStop: () => void;
  onStatementChange: (value: string) => void;
};
