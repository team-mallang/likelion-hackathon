import type { InterpreterConnectionState } from "@/features/police-support/services/interpreterEngine";
import type {
  InterpreterTurn,
  PoliceSupportOverview,
  SpeakerRole,
} from "@/features/police-support/types/policeSupport";

export type PoliceSupportMicrophoneStatus =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "LISTENING"
  | "PROCESSING"
  | "INTERRUPTED";

export type PoliceReportActionStatus =
  | "NONE"
  | "GENERATING"
  | "READY"
  | "FAILED";

export type PoliceSupportViewProps = {
  overview: PoliceSupportOverview | null;
  turns: InterpreterTurn[];
  activeSpeakerRole: SpeakerRole;
  isLoading: boolean;
  errorMessage: string | null;
  isLargeText: boolean;
  sessionStatus: InterpreterConnectionState;
  microphoneStatus: PoliceSupportMicrophoneStatus;
  isTranscribing: boolean;
  isTranslating: boolean;
  permissionErrorMessage: string | null;
  connectionErrorMessage: string | null;
  reportDraftStatus: PoliceReportActionStatus;
  reportDraftErrorMessage: string | null;
  onBack: () => void;
  onRetryOverview: () => void;
  onToggleLargeText: () => void;
  onSelectSpeaker: (role: SpeakerRole) => void;
  onPressMicrophone: () => void;
  onOpenPermissionSettings: () => void;
  onRetryConnection: () => void;
  onRetryTranslation: (turnId: string) => void;
  onRunSuggestion: (suggestionId: string) => void;
  onCreateOrOpenReport: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
