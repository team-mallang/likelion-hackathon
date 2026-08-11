import type { CreateConfirmedCaseSuccessResponse } from "@project/shared";

export type SavedCase = {
  caseId: string;
  caseNumber: string;
};

type CreateCase = () => Promise<CreateConfirmedCaseSuccessResponse>;

type AuthenticateCase = (input: {
  caseNumber: string;
  password: string;
}) => Promise<{ accessToken: string }>;

export async function saveCaseIfNeeded(
  savedCase: SavedCase | null,
  createCase: CreateCase,
): Promise<SavedCase> {
  if (savedCase) {
    return savedCase;
  }

  const response = await createCase();

  return {
    caseId: response.data.caseId,
    caseNumber: response.data.case.caseNumber,
  };
}

export async function authenticateSavedCase(
  savedCase: SavedCase,
  password: string,
  authenticateCase: AuthenticateCase,
) {
  return authenticateCase({
    caseNumber: savedCase.caseNumber,
    password,
  });
}
