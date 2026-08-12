import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";

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
      <FlowHeader onBack={onBack} step="3/6" title="분실·도난 신고" />
      <ProgressBar progress={progress} />

      <AppScreen
        footer={
          <View style={styles.footerContent}>
            {hasQuestions ? (
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
                          : "이 내용으로 분석하기"
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
            )}
          </View>
        }
      >
        {hasQuestions ? (
          <View style={styles.container}>
            <View style={styles.questionPanel}>
              <View style={styles.introduction}>
                <Text style={styles.eyebrow}>● AI 분석 기반 추가 질문</Text>
                <Text style={styles.title}>지능형 사건 분석 중...</Text>
                <Text style={styles.subtitle}>
                  정확한 신고를 위해 몇 가지 확인이 더 필요해요.
                </Text>
                <Text style={styles.description}>
                  정확한 신고서 작성을 위해 당시 현장 상황을 조금 더
                  구체적으로 떠올려주세요.
                </Text>
              </View>

              <View style={styles.orderRow}>
                <Text style={styles.orderLabel}>현재 추가 질문</Text>
                <Text style={styles.orderCount}>
                  {currentIndex + 1} / {totalCount}
                </Text>
              </View>

              <View style={styles.questionBubble}>
                <Text style={styles.question}>{currentQuestion}</Text>
              </View>

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
                <View accessibilityRole="alert" style={styles.errorNotice}>
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
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEyebrow}>AI 분석 기반 추가 질문</Text>
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
          </View>
        )}
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    paddingBottom: 24,
  },
  questionPanel: {
    gap: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  introduction: {
    gap: 4,
  },
  eyebrow: {
    marginBottom: 4,
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
  },
  title: {
    color: "#111827",
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 33,
  },
  subtitle: {
    color: "#111827",
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 29,
  },
  description: {
    marginTop: 2,
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 19,
  },
  orderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  orderLabel: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },
  orderCount: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  questionBubble: {
    maxWidth: "88%",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderTopLeftRadius: 2,
    backgroundColor: "#BFD1FF",
  },
  question: {
    color: "#334155",
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
  },
  answerInput: {
    minHeight: 112,
    paddingTop: 14,
    paddingBottom: 14,
  },
  savingNotice: {
    gap: 4,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#EEF3FF",
  },
  savingTitle: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "800",
  },
  savingDescription: {
    color: "#64748B",
    fontSize: 13,
    lineHeight: 20,
  },
  errorNotice: {
    gap: 4,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
  },
  errorTitle: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "800",
  },
  errorMessage: {
    color: "#DC2626",
    fontSize: 14,
    lineHeight: 21,
  },
  errorGuide: {
    color: "#6B7280",
    fontSize: 13,
    lineHeight: 20,
  },
  footerContent: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
  },
  footerActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  footerButton: {
    flexGrow: 1,
    flexBasis: 220,
  },
  emptyState: {
    flex: 1,
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    justifyContent: "center",
  },
  emptyCard: {
    gap: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E8ECF4",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  emptyEyebrow: {
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  emptyError: {
    color: "#DC2626",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});
