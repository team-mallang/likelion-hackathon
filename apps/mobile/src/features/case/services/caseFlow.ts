export type TranscribeAudioInput = {
  uri: string;
  mimeType?: string;
  durationMs?: number;
};

export type TranscribeAudioResult = {
  statement: string;
};

export type CaseFlow = {
  transcribeAudio: (
    input: TranscribeAudioInput,
  ) => Promise<TranscribeAudioResult>;
};

export type CaseFlowErrorCode =
  | "INVALID_INPUT"
  | "TRANSCRIPTION_FAILED";

export class CaseFlowError extends Error {
  constructor(
    public readonly code: CaseFlowErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CaseFlowError";
  }
}
