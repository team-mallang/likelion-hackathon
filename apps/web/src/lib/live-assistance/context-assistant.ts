import {
  answerWithLiveIncidentContext,
  type LiveContextAssistantResult,
} from "@project/ai";

import type { LiveAssistanceIncidentContext } from "./incident-context";

export type ContextAssistantResult = LiveContextAssistantResult;

export function answerWithIncidentContext(input: {
  statement: string;
  incident: LiveAssistanceIncidentContext;
  recentStatements?: string[];
}): Promise<ContextAssistantResult> {
  return answerWithLiveIncidentContext({
    ...input,
    incident: { ...input.incident, items: input.incident.items.map((item) => ({ ...item })) },
  });
}
