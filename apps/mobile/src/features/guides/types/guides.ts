export type GuideUrgency = "URGENT" | "IMPORTANT" | "NORMAL";

export type GuideActionType =
  | "CALL"
  | "MAP"
  | "DETAIL"
  | "FORM"
  | "POLICE_SUPPORT"
  | "NONE";

export type GuideCompletionStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED";

export type CaseGuide = {
  guideId: string;
  priority: number;
  urgency: GuideUrgency;
  title: string;
  description: string | null;
  reason: string | null;
  preparations: string[];
  institutionName: string | null;
  contact: string | null;
  estimatedMinutes: number | null;
  actionType: GuideActionType;
  actionLabel: string | null;
  completionStatus: GuideCompletionStatus;
  completedAt: string | null;
};

export type CaseGuidesOverview = {
  caseId: string;
  caseNumber: string;
  reportStatusLabel: string;
  progressPercent: number;
  heading: string;
  recommendationReason: string | null;
  guides: CaseGuide[];
};
