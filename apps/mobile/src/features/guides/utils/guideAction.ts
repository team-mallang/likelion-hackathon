import type { GuideActionType } from "@/features/guides/types/guides";

type GuideActionInput = {
  title: string;
  institutionName: string | null;
};

export type GuideAction = {
  actionType: GuideActionType;
  actionLabel: string | null;
};

const POLICE_GUIDE_PATTERN = /경찰|police/i;

export function resolveGuideAction({
  title,
  institutionName,
}: GuideActionInput): GuideAction {
  if (
    POLICE_GUIDE_PATTERN.test(title) ||
    POLICE_GUIDE_PATTERN.test(institutionName ?? "")
  ) {
    return {
      actionType: "NEARBY_AGENCIES",
      actionLabel: "가까운 경찰서 찾기 / 길찾기",
    };
  }

  return { actionType: "NONE", actionLabel: null };
}
