import type { InterpreterTurn } from "@/features/police-support/types/policeSupport";

export type PoliceConversationEntry = {
  turnId: string;
  speakerRole: InterpreterTurn["speakerRole"];
  sourceLanguage: InterpreterTurn["sourceLanguage"];
  targetLanguage: InterpreterTurn["targetLanguage"];
  originalText: string;
  translatedText: string;
  completedAt: string;
};

const conversationsByCase = new Map<string, PoliceConversationEntry[]>();

/** Keeps only completed turns in memory; no conversation text is sent to or stored by our API. */
export function syncPoliceConversation(caseId: string, turns: InterpreterTurn[]) {
  const existing = conversationsByCase.get(caseId) ?? [];
  const existingByTurnId = new Map(existing.map((entry) => [entry.turnId, entry]));

  for (const turn of turns) {
    if (turn.status !== "FINAL" || !turn.originalText.trim() || !turn.translatedText?.trim()) {
      continue;
    }

    existingByTurnId.set(turn.turnId, {
      turnId: turn.turnId,
      speakerRole: turn.speakerRole,
      sourceLanguage: turn.sourceLanguage,
      targetLanguage: turn.targetLanguage,
      originalText: turn.originalText,
      translatedText: turn.translatedText,
      completedAt: existingByTurnId.get(turn.turnId)?.completedAt ?? new Date().toISOString(),
    });
  }

  conversationsByCase.set(caseId, [...existingByTurnId.values()]);
}

export function getPoliceConversation(caseId: string) {
  return conversationsByCase.get(caseId) ?? [];
}
