import { Platform } from "react-native";

import {
  CaseFlowError,
  type TranscribeAudioInput,
  type TranscribeAudioResult,
} from "./caseFlow";

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function getApiUrl(path: string) {
  if (configuredBaseUrl) {
    return `${configuredBaseUrl}${path}`;
  }

  if (Platform.OS === "web") {
    return path;
  }

  throw new CaseFlowError("API_NOT_CONFIGURED", "STT API address is not configured.");
}

function mimeTypeFor(input: TranscribeAudioInput) {
  if (input.mimeType) {
    return input.mimeType;
  }

  const uri = input.uri.toLowerCase();
  if (uri.endsWith(".webm")) return "audio/webm";
  if (uri.endsWith(".3gp")) return "audio/3gpp";
  return "audio/mp4";
}

function filenameFor(input: TranscribeAudioInput, mimeType: string) {
  const match = /\/([^/?#]+)(?:[?#]|$)/.exec(input.uri);
  if (match?.[1]) return match[1];
  return mimeType === "audio/webm" ? "recording.webm" : "recording.m4a";
}

export async function transcribeCaseAudio(
  input: TranscribeAudioInput,
): Promise<TranscribeAudioResult> {
  if (!input.uri.trim()) {
    throw new CaseFlowError("INVALID_INPUT", "No recording is available.");
  }

  const mimeType = mimeTypeFor(input);
  const formData = new FormData();
  formData.append(
    "audio",
    {
      uri: input.uri,
      type: mimeType,
      name: filenameFor(input, mimeType),
    } as unknown as Blob,
  );

  let response: Response;
  try {
    response = await fetch(getApiUrl("/api/stt/transcribe"), {
      method: "POST",
      body: formData,
    });
  } catch (error) {
    if (error instanceof CaseFlowError) throw error;
    throw new CaseFlowError("NETWORK_ERROR", "Unable to reach the transcription service.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new CaseFlowError("INVALID_RESPONSE", "The transcription service returned an invalid response.");
  }

  const statement =
    typeof body === "object" && body !== null && "data" in body &&
    typeof body.data === "object" && body.data !== null && "statement" in body.data &&
    typeof body.data.statement === "string"
      ? body.data.statement.trim()
      : "";

  if (!response.ok || !statement) {
    throw new CaseFlowError("TRANSCRIPTION_FAILED", "Unable to transcribe the recording.");
  }

  return { statement };
}
