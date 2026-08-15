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
  isEditingStatement,
  isAnalyzing,
  errorMessage,
  canAnalyze,
  onAnalyze,
  onBack,
  onRecordAgain,
  onStatementChange,
  onStatementEditToggle,
}: ReviewViewProps) {
  return (
    <>
      <FlowHeader onBack={onBack} title="내용 확인" />
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
                scrollEnabled={false}
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

          <Button
            title="다시 녹음하기"
            onPress={onRecordAgain}
            variant="secondary"
          />

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
