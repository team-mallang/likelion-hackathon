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
import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { InterpreterConversation } from "@/features/police-support/components/InterpreterConversation";
import { PoliceSupportControls } from "@/features/police-support/components/PoliceSupportControls";
import { PoliceSupportSummaryCard } from "@/features/police-support/components/PoliceSupportSummaryCard";
import type { PoliceSupportOverview } from "@/features/police-support/types/policeSupport";
import { colors, radius, spacing } from "@/theme/tokens";

import type { PoliceSupportViewProps } from "./PoliceSupportView.types";

export function PoliceSupportViewShared(props: PoliceSupportViewProps) {
  if (props.isLargeText && props.overview) {
    return (
      <LargeTextPresentation
        onClose={props.onToggleLargeText}
        overview={props.overview}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <PoliceSupportHeader onBack={props.onBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {props.isLoading ? (
          <View style={styles.stateCard}>
            <LoadingState message="경찰 지원 내용을 준비하고 있습니다." />
          </View>
        ) : props.errorMessage ? (
          <View style={styles.stateCard}>
            <ErrorState
              message={props.errorMessage}
              onRetry={props.onRetryOverview}
            />
          </View>
        ) : props.overview ? (
          <PoliceSupportContent {...props} overview={props.overview} />
        ) : (
          <View style={styles.stateCard}>
            <ErrorState
              message="표시할 경찰 지원 정보가 없습니다."
              onRetry={props.onRetryOverview}
            />
          </View>
        )}
      </ScrollView>

      {props.overview && !props.isLoading && !props.errorMessage ? (
        <PoliceSupportControls
          activeSpeakerRole={props.activeSpeakerRole}
          connectionErrorMessage={props.connectionErrorMessage}
          microphoneStatus={props.microphoneStatus}
          onCreateOrOpenReport={props.onCreateOrOpenReport}
          onOpenPermissionSettings={props.onOpenPermissionSettings}
          onPressMicrophone={props.onPressMicrophone}
          onRetryConnection={props.onRetryConnection}
          onSelectSpeaker={props.onSelectSpeaker}
          permissionErrorMessage={props.permissionErrorMessage}
          reportDraftErrorMessage={props.reportDraftErrorMessage}
          reportDraftStatus={props.reportDraftStatus}
          sessionStatus={props.sessionStatus}
        />
      ) : null}

      <CaseBottomNavigation
        activeTab="case"
        onCaseTab={props.onCaseTab}
        onDocumentsTab={props.onDocumentsTab}
        onGuideTab={props.onGuideTab}
      />
    </SafeAreaView>
  );
}

type PoliceSupportContentProps = PoliceSupportViewProps & {
  overview: PoliceSupportOverview;
};

function PoliceSupportContent({
  overview,
  turns,
  isTranscribing,
  isTranslating,
  onToggleLargeText,
  onRetryTranslation,
  onRunSuggestion,
}: PoliceSupportContentProps) {
  return (
    <View style={styles.stack}>
      <View style={styles.summaryHeading}>
        <View style={styles.summaryTitleArea}>
          <Ionicons
            accessibilityElementsHidden
            color={colors.primary}
            name="sparkles-outline"
            size={22}
          />
          <Text accessibilityRole="header" style={styles.summaryTitle}>
            AI 상황 요약
          </Text>
        </View>

        <Pressable
          accessibilityLabel="경찰관 제시문 큰 글씨로 보기"
          accessibilityRole="button"
          onPress={onToggleLargeText}
          style={({ pressed }) => [
            styles.largeTextButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.background}
            name="search-outline"
            size={18}
          />
          <Text style={styles.largeTextButtonText}>큰 글씨</Text>
        </Pressable>
      </View>

      <PoliceSupportSummaryCard overview={overview} />

      <InterpreterConversation
        isTranscribing={isTranscribing}
        isTranslating={isTranslating}
        onRetryTranslation={onRetryTranslation}
        turns={turns}
      />

      {overview.suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {overview.suggestions.map((suggestion) => {
            const actionable = suggestion.actionType !== "NONE";

            return (
              <Pressable
                accessibilityRole={actionable ? "button" : "text"}
                disabled={!actionable}
                key={suggestion.id}
                onPress={() => onRunSuggestion(suggestion.id)}
                style={({ pressed }) => [
                  styles.suggestion,
                  pressed && actionable && styles.pressed,
                ]}
              >
                <Ionicons
                  accessibilityElementsHidden
                  color={colors.error}
                  name="information-circle-outline"
                  size={20}
                />
                <Text style={styles.suggestionText}>
                  AI: {suggestion.message}
                </Text>
                {actionable ? (
                  <Ionicons
                    accessibilityElementsHidden
                    color={colors.error}
                    name="chevron-forward"
                    size={18}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.privacyNotice}>
        <Ionicons
          accessibilityElementsHidden
          color={colors.textSecondary}
          name="shield-checkmark-outline"
          size={18}
        />
        <Text style={styles.privacyNoticeText}>
          번역 결과에는 오류가 있을 수 있습니다. 이름·날짜·금액 같은 핵심
          정보는 원문과 함께 다시 확인해 주세요.
        </Text>
      </View>
    </View>
  );
}

function PoliceSupportHeader({
  onBack,
}: Pick<PoliceSupportViewProps, "onBack">) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="경찰 지원 화면에서 뒤로가기"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={styles.backButton}
      >
        <Ionicons
          accessibilityElementsHidden
          color={colors.primary}
          name="arrow-back"
          size={28}
        />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        경찰 지원
      </Text>
    </View>
  );
}

type LargeTextPresentationProps = {
  overview: PoliceSupportOverview;
  onClose: () => void;
};

function LargeTextPresentation({
  overview,
  onClose,
}: LargeTextPresentationProps) {
  return (
    <SafeAreaView style={styles.presentationSafeArea}>
      <View style={styles.presentationHeader}>
        <View style={styles.presentationHeaderSpacer} />
        <Text accessibilityRole="header" style={styles.presentationTitle}>
          경찰관에게 보여주세요
        </Text>
        <Pressable
          accessibilityLabel="큰 글씨 닫기"
          accessibilityRole="button"
          hitSlop={12}
          onPress={onClose}
          style={styles.presentationClose}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.text}
            name="close"
            size={28}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.presentationContent}>
        <Text accessibilityLanguage="ja" style={styles.presentationJapanese}>
          {overview.presentationScript.ja}
        </Text>
        <View style={styles.presentationDivider} />
        <Text accessibilityLanguage="ko" style={styles.presentationKorean}>
          {overview.presentationScript.ko}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    width: "100%",
    maxWidth: 480,
    minHeight: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    minHeight: 44,
    alignItems: "flex-start",
    justifyContent: "center",
    cursor: "pointer",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  content: {
    width: "100%",
    maxWidth: 480,
    flexGrow: 1,
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stack: {
    gap: spacing.lg,
  },
  summaryHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  summaryTitleArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  summaryTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  largeTextButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    cursor: "pointer",
  },
  largeTextButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "800",
  },
  suggestions: {
    gap: spacing.sm,
  },
  suggestion: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: radius.lg,
    backgroundColor: colors.errorSoft,
    cursor: "pointer",
  },
  suggestionText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 19,
  },
  privacyNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  privacyNoticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  stateCard: {
    minHeight: 360,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  pressed: {
    opacity: 0.78,
  },
  presentationSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  presentationHeader: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  presentationHeaderSpacer: {
    width: 48,
  },
  presentationTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  presentationClose: {
    width: 48,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  presentationContent: {
    minHeight: "100%",
    justifyContent: "center",
    gap: spacing.xl,
    padding: spacing.xl,
  },
  presentationJapanese: {
    color: colors.text,
    fontSize: 34,
    fontWeight: "900",
    lineHeight: 50,
    textAlign: "center",
  },
  presentationDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  presentationKorean: {
    color: colors.textSecondary,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
  },
});
