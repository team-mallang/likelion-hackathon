import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { colors, radius, spacing } from "@/theme/tokens";

import type { QuestionsViewProps } from "./QuestionsView.types";

export function QuestionsView({
  currentQuestion,
  currentAnswer,
  currentIndex,
  totalCount,
  progress,
  isFirstQuestion,
  isLastQuestion,
  isSaving,
  errorMessage,
  onAnswerChange,
  onBack,
  onComplete,
  onNext,
  onPrevious,
}: QuestionsViewProps) {
  const hasQuestions = currentQuestion !== null;

  return (
    <>
      <FlowHeader onBack={onBack} title="추가 질문" />
      <ProgressBar progress={progress} />

      <AppScreen
        footer={
          hasQuestions ? (
            <View style={styles.footerActions}>
              {!isFirstQuestion ? (
                <View style={styles.footerButton}>
                  <Button
                    title="이전 질문"
                    onPress={onPrevious}
                    variant="outline"
                    disabled={isSaving}
                  />
                </View>
              ) : null}

              <View style={styles.footerButton}>
                <Button
                  title={
                    isLastQuestion
                      ? errorMessage && currentAnswer.trim()
                        ? "다시 분석하기"
                        : "답변 완료하고 분석하기"
                      : "다음 질문"
                  }
                  onPress={isLastQuestion ? onComplete : onNext}
                  loading={isSaving}
                  disabled={isSaving}
                />
              </View>
            </View>
          ) : (
            <Button title="내용 확인으로 돌아가기" onPress={onBack} />
          )
        }
      >
        {hasQuestions ? (
          <View style={styles.container}>
            <View style={styles.introduction}>
              <Text style={styles.eyebrow}>AI 맞춤 질문</Text>
              <Text style={styles.title}>몇 가지만 더 확인할게요</Text>
              <Text style={styles.description}>
                앞서 입력한 사건 내용을 바탕으로 신고서 작성에 필요한
                내용을 질문합니다.
              </Text>
            </View>

            <Text style={styles.order}>
              {currentIndex + 1} / {totalCount}
            </Text>

            <View style={styles.questionCard}>
              <Text style={styles.question}>{currentQuestion}</Text>

              <AppTextInput
                label="답변"
                multiline
                editable={!isSaving}
                onChangeText={onAnswerChange}
                placeholder="알고 있는 내용을 자세히 입력해 주세요."
                style={styles.answerInput}
                textAlignVertical="top"
                value={currentAnswer}
              />
            </View>

            {isSaving ? (
              <View
                accessibilityLiveRegion="polite"
                style={styles.savingNotice}
              >
                <Text style={styles.savingTitle}>답변을 분석하고 있어요</Text>
                <Text style={styles.savingDescription}>
                  사건 카드에 들어갈 내용을 정리하고 있습니다.
                </Text>
              </View>
            ) : null}

            {errorMessage ? (
              <View accessibilityRole="alert" style={styles.errorContainer}>
                <Text style={styles.errorTitle}>확인해 주세요</Text>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
                {isLastQuestion ? (
                  <Text style={styles.errorGuide}>
                    입력한 답변은 유지됩니다. 내용을 확인한 뒤 다시 시도해
                    주세요.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>추가 질문이 없습니다</Text>
            <Text style={styles.emptyDescription}>
              사건 내용을 다시 분석해야 합니다. 이전 내용 확인 화면으로
              돌아가 분석을 다시 진행해 주세요.
            </Text>

            {errorMessage ? (
              <Text accessibilityRole="alert" style={styles.emptyError}>
                {errorMessage}
              </Text>
            ) : null}
          </View>
        )}
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  introduction: {
    gap: spacing.sm,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  order: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  questionCard: {
    gap: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  question: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 29,
  },
  answerInput: {
    minHeight: 160,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  savingNotice: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  savingTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  savingDescription: {
    color: colors.textSecondary,
    fontSize: 14,
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
  footerActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  footerButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
    textAlign: "center",
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  emptyError: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});
