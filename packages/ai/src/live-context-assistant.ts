import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import { getOpenAIClient, getOpenAIModel } from "./client";
import { sanitizeLiveContextInputForAI } from "./pii-boundaries";

export const liveIncidentSchema = z.object({
  type: z.string(), countryCode: z.string().nullable(), lastSeenAt: z.string().nullable(), lastSeenPlace: z.string().nullable(), discoveredAt: z.string().nullable(), discoveredPlace: z.string().nullable(), description: z.string().nullable().optional(),
  items: z.array(z.object({ category: z.string().nullable(), name: z.string(), color: z.string().nullable().optional(), brand: z.string().nullable().optional(), model: z.string().nullable().optional(), identifyingFeature: z.string().nullable().optional(), quantity: z.number() })),
});
export const liveContextAssistantResultSchema = z.object({
  relevant: z.boolean(), relevantFacts: z.array(z.string().min(1)).max(5), tip: z.string().min(1).max(400), missingInformation: z.string().min(1).max(300),
});
export type LiveIncident = z.infer<typeof liveIncidentSchema>;
export type LiveContextAssistantResult = z.infer<typeof liveContextAssistantResultSchema>;

export async function answerWithLiveIncidentContext(input: { statement: string; incident: LiveIncident; recentStatements?: string[] }): Promise<LiveContextAssistantResult> {
  const sanitizedInput = await sanitizeLiveContextInputForAI(input);
  const response = await getOpenAIClient().responses.parse({
    model: getOpenAIModel(),
    instructions: "You assist a traveler speaking with a police officer after a theft. Use only the provided incident context. Never invent facts, names, times, places, or procedures. Give a concise Korean response that helps the traveler answer the officer. If a fact is absent, say that it is not recorded on the incident card. Return the requested structured output only.",
    input: JSON.stringify(sanitizedInput),
    text: { format: zodTextFormat(liveContextAssistantResultSchema, "incident_context_help") },
  });
  const parsed = liveContextAssistantResultSchema.safeParse(response.output_parsed);
  if (!parsed.success) throw new Error("OpenAI returned an invalid context response.");
  return parsed.data;
}
