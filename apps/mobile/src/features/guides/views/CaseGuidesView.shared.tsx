import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { formatCaseNumber } from "@/features/case/utils/formatCaseNumber";
import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import type { CaseGuide, GuideUrgency } from "@/features/guides/types/guides";
import { colors, radius, spacing } from "@/theme/tokens";

import type { CaseGuidesViewProps } from "./CaseGuidesView.types";

export function CaseGuidesView({
  overview,
  isLoading,
  errorMessage,
  updatingGuideId,
  onBack,
  onRetry,
  onRunGuideAction,
  onCompleteGuide,
  onCaseTab,
  onGuideTab,
  onDocumentsTab,
}: CaseGuidesViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <GuidesHeader onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <LoadingState message="행동 가이드를 불러오고 있습니다." />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={onRetry} />
        ) : overview ? (
          <GuidesContent
            onCompleteGuide={onCompleteGuide}
            onRunGuideAction={onRunGuideAction}
            overview={overview}
            updatingGuideId={updatingGuideId}
          />
        ) : (
          <EmptyGuidesState />
        )}
      </ScrollView>
      <CaseBottomNavigation
        activeTab="guide"
        onCaseTab={onCaseTab}
        onDocumentsTab={onDocumentsTab}
        onGuideTab={onGuideTab}
      />
    </SafeAreaView>
  );
}

function GuidesHeader({ onBack }: Pick<CaseGuidesViewProps, "onBack">) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="행동 가이드에서 뒤로가기"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={styles.backButton}
      >
        <Ionicons color={colors.primary} name="arrow-back" size={24} />
      </Pressable>
      <Text style={styles.headerTitle}>분실·도난 신고</Text>
      <Text style={styles.step}>3/6</Text>
    </View>
  );
}

function GuidesContent({
  overview,
  updatingGuideId,
  onRunGuideAction,
  onCompleteGuide,
}: Pick<
  CaseGuidesViewProps,
  "overview" | "updatingGuideId" | "onRunGuideAction" | "onCompleteGuide"
> & { overview: NonNullable<CaseGuidesViewProps["overview"]> }) {
  const orderedGuides = [...overview.guides].sort((left, right) => {
    const urgencyDifference = urgencyRank(right.urgency) - urgencyRank(left.urgency);
    return urgencyDifference || right.priority - left.priority || left.guideId.localeCompare(right.guideId);
  });

  return (
    <View style={styles.stack}>
      <Text style={styles.title}>{overview.heading}</Text>
      <CaseSummaryCard overview={overview} />
      {overview.recommendationReason ? (
        <Text style={styles.recommendationReason}>{overview.recommendationReason}</Text>
      ) : null}

      {orderedGuides.length > 0 ? (
        <View style={styles.guideList}>
          {orderedGuides.map((guide) => (
            <GuideCard
              guide={guide}
              isUpdating={updatingGuideId === guide.guideId}
              key={guide.guideId}
              onComplete={() => onCompleteGuide(guide.guideId)}
              onRunAction={() => onRunGuideAction(guide.guideId)}
            />
          ))}
        </View>
      ) : (
        <EmptyGuidesState />
      )}

      <View style={styles.notice}>
        <Ionicons color={colors.textSecondary} name="information-circle-outline" size={20} />
        <Text style={styles.noticeText}>
          가이드는 확정된 사건 정보를 기준으로 제공됩니다. 사건 정보가 바뀌면 안내 순서도 업데이트될 수 있습니다.
        </Text>
      </View>
    </View>
  );
}

function CaseSummaryCard({
  overview,
}: {
  overview: NonNullable<CaseGuidesViewProps["overview"]>;
}) {
  const progress = Math.min(100, Math.max(0, Math.round(overview.progressPercent)));

  return (
    <View style={styles.summaryCard}>
      <View style={styles.summaryTopRow}>
        <Text style={styles.caseNumber}>사건번호: {formatCaseNumber(overview.caseNumber)}</Text>
        <Text style={styles.status}>{overview.reportStatusLabel}</Text>
      </View>
      <View style={styles.progressRow}>
        <Text style={styles.progressLabel}>신고 진행률</Text>
        <Text style={styles.progressValue}>{progress}%</Text>
      </View>
      <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: progress }} style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

function GuideCard({
  guide,
  isUpdating,
  onRunAction,
  onComplete,
}: {
  guide: CaseGuide;
  isUpdating: boolean;
  onRunAction: () => void;
  onComplete: () => void;
}) {
  const completed = guide.completionStatus === "COMPLETED";
  const urgency = urgencyLabel(guide.urgency);

  return (
    <View style={[styles.guideCard, urgency.card]}>
      <View style={styles.guideMetaRow}>
        <Text style={[styles.urgencyBadge, urgency.badge]}>{urgency.label}</Text>
        {guide.estimatedMinutes !== null ? <Text style={styles.estimatedTime}>약 {guide.estimatedMinutes}분</Text> : null}
        {completed ? <Text style={styles.completedLabel}>완료됨</Text> : null}
      </View>
      <Text style={[styles.guideTitle, completed && styles.completedTitle]}>{guide.title}</Text>
      {guide.description ? <Text style={styles.guideDescription}>{guide.description}</Text> : null}
      {guide.institutionName ? <Text style={styles.institution}>{guide.institutionName}</Text> : null}
      <View style={styles.guideActions}>
        {guide.actionType !== "NONE" && guide.actionLabel ? (
          <Pressable accessibilityRole="button" disabled={isUpdating} onPress={onRunAction} style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{guide.actionLabel}</Text>
            <Ionicons color={colors.primary} name="chevron-forward" size={18} />
          </Pressable>
        ) : null}
        {!completed ? (
          <Pressable accessibilityRole="button" disabled={isUpdating} onPress={onComplete} style={styles.completeButton}>
            <Ionicons color={colors.primary} name="checkmark-circle-outline" size={19} />
            <Text style={styles.completeButtonText}>{isUpdating ? "처리 중" : "완료"}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function EmptyGuidesState() {
  return (
    <View style={styles.emptyState}>
      <Ionicons color={colors.primary} name="compass-outline" size={28} />
      <Text style={styles.emptyTitle}>행동 가이드를 준비하고 있어요</Text>
      <Text style={styles.emptyDescription}>
        확정된 사건 정보를 바탕으로 필요한 안내를 정리해 보여드릴게요.
      </Text>
    </View>
  );
}

function urgencyRank(urgency: GuideUrgency) {
  return urgency === "URGENT" ? 3 : urgency === "IMPORTANT" ? 2 : 1;
}

function urgencyLabel(urgency: GuideUrgency) {
  if (urgency === "URGENT") {
    return { label: "긴급", badge: styles.urgentBadge, card: styles.urgentCard };
  }
  if (urgency === "IMPORTANT") {
    return { label: "중요", badge: styles.importantBadge, card: styles.importantCard };
  }
  return { label: "일반", badge: styles.normalBadge, card: styles.normalCard };
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { minHeight: 52, alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.md },
  backButton: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  step: { minWidth: 44, color: colors.primary, fontSize: 14, fontWeight: "800", textAlign: "right" },
  content: { flexGrow: 1, padding: spacing.md },
  stack: { gap: spacing.md },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 32 },
  summaryCard: { gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background, padding: spacing.md },
  summaryTopRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  caseNumber: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  status: { borderRadius: radius.lg, backgroundColor: colors.primarySoft, color: colors.primary, fontSize: 13, fontWeight: "700", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  progressRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: colors.textSecondary, fontSize: 13 },
  progressValue: { color: colors.primary, fontSize: 16, fontWeight: "800" },
  progressTrack: { height: 8, overflow: "hidden", borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  progressFill: { height: "100%", borderRadius: radius.lg, backgroundColor: colors.primary },
  recommendationReason: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  guideList: { gap: spacing.sm },
  guideCard: { gap: spacing.sm, borderLeftWidth: 3, borderRadius: radius.md, backgroundColor: colors.background, padding: spacing.md },
  urgentCard: { borderLeftColor: colors.error },
  importantCard: { borderLeftColor: colors.primary },
  normalCard: { borderLeftColor: colors.border },
  guideMetaRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  urgencyBadge: { borderRadius: radius.sm, fontSize: 12, fontWeight: "800", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  urgentBadge: { backgroundColor: colors.errorSoft, color: colors.error },
  importantBadge: { backgroundColor: colors.primarySoft, color: colors.primary },
  normalBadge: { backgroundColor: colors.surface, color: colors.textSecondary },
  estimatedTime: { color: colors.textSecondary, fontSize: 12 },
  completedLabel: { marginLeft: "auto", color: colors.primary, fontSize: 12, fontWeight: "700" },
  guideTitle: { color: colors.text, fontSize: 17, fontWeight: "800", lineHeight: 24 },
  completedTitle: { color: colors.textSecondary, textDecorationLine: "line-through" },
  guideDescription: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  institution: { color: colors.text, fontSize: 13, fontWeight: "700" },
  guideActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  actionButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.primarySoft, paddingHorizontal: spacing.md, justifyContent: "center" },
  actionButtonText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  completeButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.md, justifyContent: "center" },
  completeButtonText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  notice: { flexDirection: "row", gap: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", padding: spacing.md },
  noticeText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  emptyState: { alignItems: "center", gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.background, padding: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  emptyDescription: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center" },
});
