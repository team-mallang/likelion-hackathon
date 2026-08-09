import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { colors, radius, spacing } from "@/theme/tokens";

import type { ReviewViewProps } from "./ReviewView.types";

export function ReviewView({
  statement,
  locationText,
  occurredAtText,
  expectedCaseTypeLabel,
  isEditingStatement,
  isEditingLocation,
  isEditingTime,
  isAnalyzing,
  errorMessage,
  canAnalyze,
  onAnalyze,
  onBack,
  onLocationChange,
  onLocationEditToggle,
  onOccurredAtChange,
  onRecordAgain,
  onStatementChange,
  onStatementEditToggle,
  onTimeEditToggle,
}: ReviewViewProps) {
  return (
    <>
      <FlowHeader onBack={onBack} step="4/6" title="내용 확인" />
      <ProgressBar progress={4 / 6} />

      <AppScreen
        footer={
          <Button
            title={
              errorMessage ? "다시 분석하기" : "이 내용으로 분석하기"
            }
            onPress={onAnalyze}
            disabled={!canAnalyze}
            loading={isAnalyzing}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>말씀해주신 내용이 맞나요?</Text>

          <View style={styles.card}>
            <Text style={styles.label}>사건 내용</Text>
            {isEditingStatement ? (
              <AppTextInput
                label="사건 내용 수정"
                multiline
                onChangeText={onStatementChange}
                style={styles.statementInput}
                textAlignVertical="top"
                value={statement}
              />
            ) : (
              <Text style={styles.value}>
                {statement || "입력된 사건 내용이 없습니다."}
              </Text>
            )}
            <Button
              title={isEditingStatement ? "내용 수정 완료" : "내용 수정"}
              onPress={onStatementEditToggle}
              variant="outline"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>사건 발생 장소</Text>
            {isEditingLocation ? (
              <AppTextInput
                label="장소 수정"
                onChangeText={onLocationChange}
                value={locationText}
              />
            ) : (
              <Text style={styles.value}>
                {locationText || "입력된 장소가 없습니다."}
              </Text>
            )}
            <Button
              title={isEditingLocation ? "장소 수정 완료" : "장소 수정"}
              onPress={onLocationEditToggle}
              variant="outline"
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>사건 발생 시간</Text>
            {isEditingTime ? (
              <AppTextInput
                label="시간 수정"
                onChangeText={onOccurredAtChange}
                value={occurredAtText}
              />
            ) : (
              <Text style={styles.value}>
                {occurredAtText || "입력된 시간이 없습니다."}
              </Text>
            )}
            <Button
              title={isEditingTime ? "시간 수정 완료" : "시간 수정"}
              onPress={onTimeEditToggle}
              variant="outline"
            />
          </View>

          <Button
            title="다시 녹음하기"
            onPress={onRecordAgain}
            variant="secondary"
          />

          <View style={styles.analysisCard}>
            <View style={styles.analysisHeading}>
              <Text style={styles.analysisBadge}>AI 분석</Text>
              <Text style={styles.label}>예상 신고서 유형</Text>
            </View>
            <Text style={styles.analysisValue}>{expectedCaseTypeLabel}</Text>
            <Text style={styles.analysisDescription}>
              입력한 내용을 분석해 신고서 초안에 필요한 추가 질문을
              준비합니다.
            </Text>

            {isAnalyzing ? (
              <Text
                accessibilityLiveRegion="polite"
                style={styles.analysisStatus}
              >
                사건 내용을 분석하고 있습니다. 잠시만 기다려 주세요.
              </Text>
            ) : null}
          </View>

          {errorMessage ? (
            <View accessibilityRole="alert" style={styles.errorContainer}>
              <Text style={styles.errorTitle}>분석하지 못했습니다</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <Text style={styles.errorGuide}>
                입력한 내용은 그대로 유지됩니다. 아래 버튼을 눌러 다시
                시도해 주세요.
              </Text>
            </View>
          ) : null}
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
  },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  statementInput: {
    minHeight: 140,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  analysisCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  analysisHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  analysisBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    color: colors.background,
    backgroundColor: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
  },
  analysisValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800",
  },
  analysisDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  analysisStatus: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 21,
  },
  errorContainer: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
  },
  errorTitle: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "800",
  },
  errorMessage: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 21,
  },
  errorGuide: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
