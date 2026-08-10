export type PreviousCaseLookupInput = {
  caseNumber: string;
  password: string;
};

export type PreviousCaseLookupResult = {
  caseId: string;
  caseNumber: string;
  status: string;
  accessToken: string;
};
