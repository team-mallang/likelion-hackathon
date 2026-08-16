import assert from "node:assert/strict";
import test from "node:test";

import { getPoliceConversation, syncPoliceConversation } from "./policeConversation";

test("stores only completed translated police conversation turns", () => {
  const caseId = "case-police-conversation-test";
  syncPoliceConversation(caseId, [
    {
      id: "partial", sessionId: "session", turnId: "partial", speakerRole: "TRAVELER", sourceLanguage: "ko-KR", targetLanguage: "ja-JP", originalText: "분실했어요", translatedText: null, sequence: 1, status: "PARTIAL", errorMessage: null,
    },
    {
      id: "final", sessionId: "session", turnId: "final", speakerRole: "POLICE_OFFICER", sourceLanguage: "ja-JP", targetLanguage: "ko-KR", originalText: "どこで失くしましたか。", translatedText: "어디에서 잃어버렸나요?", sequence: 2, status: "FINAL", errorMessage: null,
    },
  ]);

  const entries = getPoliceConversation(caseId);
  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.speakerRole, "POLICE_OFFICER");
  assert.equal(entries[0]?.translatedText, "어디에서 잃어버렸나요?");
});
