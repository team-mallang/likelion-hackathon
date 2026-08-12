export type PreviousCaseItem = {
  id: string;
  title: string;
  description: string | null;
};

export type PreviousCaseDetail = {
  label: string;
  value: string;
};

export type PreviousCaseCard = {
  caseId: string;
  caseNumber: string;
  reportStatusLabel: string;
  title: string;
  incidentTypeLabel: string;
  occurredAt: string | null;
  locationLabel: string | null;
  aiSummary: string | null;
  aiSummaryStatus: "READY" | "UNAVAILABLE";
  lostItems: PreviousCaseItem[];
  clues: string | null;
  notes: string | null;
  incidentDetails: PreviousCaseDetail[];
};
