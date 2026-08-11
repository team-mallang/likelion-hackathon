import { NextResponse } from "next/server";

const ELEVENLABS_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const TRANSCRIPTION_TIMEOUT_MS = 30_000;
const ALLOWED_MIME_TYPES = new Set([
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/3gpp",
]);

function isUploadedAudio(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null &&
    "arrayBuffer" in value && typeof value.arrayBuffer === "function" &&
    "size" in value && typeof value.size === "number" &&
    "type" in value && typeof value.type === "string" &&
    "name" in value && typeof value.name === "string";
}

function errorResponse(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    return errorResponse("STT_PROVIDER_NOT_CONFIGURED", 503);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("INVALID_MULTIPART", 400);
  }

  const audio = formData.get("audio");
  if (!isUploadedAudio(audio)) {
    return errorResponse("AUDIO_FILE_REQUIRED", 400);
  }

  if (!ALLOWED_MIME_TYPES.has(audio.type)) {
    return errorResponse("UNSUPPORTED_AUDIO_TYPE", 415);
  }

  if (audio.size <= 0) {
    return errorResponse("EMPTY_AUDIO_FILE", 400);
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return errorResponse("AUDIO_FILE_TOO_LARGE", 413);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS);

  try {
    // The uploaded audio remains in memory only: no filesystem, database, or
    // object-storage write occurs before it is forwarded to ElevenLabs.
    const elevenFormData = new FormData();
    elevenFormData.append(
      "file",
      new File([await audio.arrayBuffer()], audio.name || "recording.m4a", {
        type: audio.type,
      }),
    );
    elevenFormData.append(
      "model_id",
      process.env.ELEVENLABS_STT_MODEL?.trim() || "scribe_v2",
    );
    elevenFormData.append("language_code", "kor");

    const response = await fetch(ELEVENLABS_URL, {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: elevenFormData,
      signal: controller.signal,
    });

    if (!response.ok) {
      return errorResponse("TRANSCRIPTION_FAILED", 502);
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return errorResponse("INVALID_TRANSCRIPTION_RESPONSE", 502);
    }

    const text =
      typeof body === "object" && body !== null && "text" in body &&
      typeof body.text === "string"
        ? body.text.trim()
        : "";

    if (!text) {
      return errorResponse("EMPTY_TRANSCRIPTION", 502);
    }

    return NextResponse.json({
      success: true,
      data: { statement: text },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return errorResponse("TRANSCRIPTION_TIMEOUT", 504);
    }

    return errorResponse("TRANSCRIPTION_FAILED", 502);
  } finally {
    clearTimeout(timeout);
  }
}
