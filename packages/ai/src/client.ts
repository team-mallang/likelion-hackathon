// OpenAI SDK 클라이언트 생성과 환경 설정 확인을 담당하는 파일

import OpenAI from "openai";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";
// Structured case analysis can take longer than a plain text completion.
// Do not retry here: the route has a deterministic fallback, and retrying a
// rate-limited request only keeps the user waiting on the same screen.
const OPENAI_REQUEST_TIMEOUT_MS = 90_000;

let openAIClient: OpenAI | null = null;

// 실제 OpenAI API 키가 설정되어 있는지 확인
export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

// 현재 Mock 모드를 사용하는지 확인
export function isAIMockMode() {
  return process.env.AI_MOCK_MODE !== "false";
}

// 필요한 시점에만 OpenAI 클라이언트를 생성
export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey,
      timeout: OPENAI_REQUEST_TIMEOUT_MS,
      maxRetries: 0,
    });
  }

  return openAIClient;
}

// OpenAI 호출에 사용할 모델명을 환경변수에서 읽음
export function getOpenAIModel() {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}
