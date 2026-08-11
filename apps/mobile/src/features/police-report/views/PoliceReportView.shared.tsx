import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { PoliceReportDocument } from "@/features/police-report/components/PoliceReportDocument";
import { colors, radius, spacing } from "@/theme/tokens";

import type { PoliceReportViewProps } from "./PoliceReportView.types";

export function PoliceReportViewShared({
  draft,
  displayLanguage,
  isLoading,
  isSwitchingLanguage,
  isRegenerating,
  isExporting,
  errorMessage,
  translationErrorMessage,
  regenerationErrorMessage,
  exportErrorMessage,
  canExport,
  hasUnsavedChanges,
  onBack,
  onRetry,
  onToggleLanguage,
  onEdit,
  onRegenerate,
  onSaveOrShare,
  onCaseTab,
  onGuideTab,
  onDocumentsTab,
}: PoliceReportViewProps) {
  const isKoreanPreview = displayLanguage === "ko";
  const isLanguageToggleDisabled =
    isLoading || isSwitchingLanguage || isRegenerating || !draft;

  return (
    <SafeAreaView style={styles.safeArea}>
      <PoliceReportHeader onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <CompletionNotice />

        <View style={styles.languageArea}>
          <View style={styles.languageRow}>
            <View style={styles.languageLabelArea}>
              <Ionicons
                accessibilityElementsHidden
                color={colors.primary}
                name="language-outline"
                size={20}
              />
              <Text style={styles.languageLabel}>한국어로 내용 확인</Text>
            </View>

            {isSwitchingLanguage ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Switch
                accessibilityLabel="한국어로 신고서 내용 확인"
                accessibilityState={{
                  checked: isKoreanPreview,
                  disabled: isLanguageToggleDisabled,
                  busy: isSwitchingLanguage,
                }}
                disabled={isLanguageToggleDisabled}
                ios_backgroundColor={colors.border}
                onValueChange={onToggleLanguage}
                thumbColor={colors.background}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                value={isKoreanPreview}
              />
            )}
          </View>

          {translationErrorMessage ? (
            <View accessibilityRole="alert" style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>
                {translationErrorMessage}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={onToggleLanguage}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>다시 시도</Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <LoadingState message="신고서 초안을 준비하고 있습니다." />
          </View>
        ) : errorMessage ? (
          <View style={styles.stateCard}>
            <ErrorState message={errorMessage} onRetry={onRetry} />
          </View>
        ) : draft ? (
          <View
            accessibilityState={{ busy: isSwitchingLanguage }}
            style={isSwitchingLanguage ? styles.switchingContent : undefined}
          >
            <PoliceReportDocument
              canExport={canExport}
              displayLanguage={displayLanguage}
              draft={draft}
              exportErrorMessage={exportErrorMessage}
              hasUnsavedChanges={hasUnsavedChanges}
              isExporting={isExporting}
              isRegenerating={isRegenerating}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              onSaveOrShare={onSaveOrShare}
              regenerationErrorMessage={regenerationErrorMessage}
            />
          </View>
        ) : (
          <View style={styles.stateCard}>
            <ErrorState
              message="표시할 신고서 초안이 없습니다."
              onRetry={onRetry}
            />
          </View>
        )}
      </ScrollView>

      <CaseBottomNavigation
        activeTab="case"
        onCaseTab={onCaseTab}
        onDocumentsTab={onDocumentsTab}
        onGuideTab={onGuideTab}
      />
    </SafeAreaView>
  );
}

type PoliceReportHeaderProps = Pick<PoliceReportViewProps, "onBack">;

function PoliceReportHeader({ onBack }: PoliceReportHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="신고서 작성 지원 화면에서 뒤로가기"
        accessibilityRole="button"
        focusable
        hitSlop={12}
        onPress={onBack}
        style={styles.headerSide}
      >
        <Ionicons
          accessibilityElementsHidden
          color={colors.text}
          name="arrow-back"
          size={24}
        />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        신고서 작성 지원
      </Text>
      <View accessibilityElementsHidden style={styles.headerSide} />
    </View>
  );
}

function CompletionNotice() {
  return (
    <View style={styles.completionNotice}>
      <View style={styles.noticeIcon}>
        <Ionicons
          accessibilityElementsHidden
          color={colors.background}
          name="document-text-outline"
          size={24}
        />
      </View>
      <View style={styles.noticeBody}>
        <Text style={styles.noticeTitle}>AI 신고서 초안 완성</Text>
        <Text style={styles.noticeDescription}>
          입력하신 사건 정보를 바탕으로 완벽한 일본어 신고서(被害届)
          초안이 작성되었습니다. 제출 전 상세 내용을 확인해 주세요.
        </Text>
      </View>
    </View>
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
    minHeight: 56,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
  },
  headerSide: {
    width: 48,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  content: {
    width: "100%",
    maxWidth: 480,
    flexGrow: 1,
    alignSelf: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  completionNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  noticeIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.primary,
  },
  noticeBody: {
    flex: 1,
    gap: spacing.xs,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  noticeDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  languageArea: {
    gap: spacing.sm,
  },
  languageRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  languageLabelArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  languageLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  inlineErrorText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    cursor: "pointer",
  },
  retryButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  stateCard: {
    minHeight: 320,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  switchingContent: {
    opacity: 0.55,
  },
});
