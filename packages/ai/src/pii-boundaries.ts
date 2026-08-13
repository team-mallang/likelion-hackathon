import type { CaseAnalysisInput } from "./case-analysis";
import type { LiveIncident } from "./live-context-assistant";
import { sanitizeTextForAI } from "./pii-sanitizer";

export async function sanitizeCaseAnalysisInputForAI(input: CaseAnalysisInput): Promise<CaseAnalysisInput> {
  const sanitizedStatement = await sanitizeTextForAI(input.initialStatement);
  const sanitizedAnswers = await Promise.all(input.answers.map(async (answer) => ({
    ...answer,
    value: typeof answer.value === "string" ? (await sanitizeTextForAI(answer.value)).text : answer.value,
  })));
  return { ...input, initialStatement: sanitizedStatement.text, answers: sanitizedAnswers };
}

export async function sanitizeLiveContextInputForAI(input: { statement: string; incident: LiveIncident; recentStatements?: string[] }) {
  const statement = await sanitizeTextForAI(input.statement);
  const recentStatements = await Promise.all((input.recentStatements ?? []).map(async (value) => (await sanitizeTextForAI(value)).text));
  return { incident: input.incident, recentPoliceStatements: recentStatements, currentPoliceStatement: statement.text };
}
