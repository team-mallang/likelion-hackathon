// OpenAI SDK 클라이언트 생성과 환경 설정 확인을 담당하는 파일

import OpenAI from "openai";

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
    throw new Error("OPENAI_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey,
    });
  }

  return openAIClient;
}