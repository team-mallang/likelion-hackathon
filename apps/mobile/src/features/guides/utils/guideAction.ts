import type { GuideActionType } from "@/features/guides/types/guides";

type GuideActionInput = {
  title: string;
  institutionName: string | null;
  priority?: number;
};

export type GuideAction = {
  actionType: GuideActionType;
  actionLabel: string | null;
};

const POLICE_GUIDE_PATTERN = /경찰|police/i;
/** Priority 90 is reserved by the guide generator for the police report step. */
const POLICE_REPORT_PRIORITY = 90;

export function resolveGuideAction({
  title,
  institutionName,
  priority,
}: GuideActionInput): GuideAction {
  if (priority === POLICE_REPORT_PRIORITY || POLICE_GUIDE_PATTERN.test(title) || POLICE_GUIDE_PATTERN.test(institutionName ?? "")) {
    return {
      actionType: "NEARBY_AGENCIES",
      actionLabel: "가까운 경찰서 찾기",
    };
  }

  return { actionType: "NONE", actionLabel: null };
}
