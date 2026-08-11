import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CaseAnalysisAnswer } from "@project/shared";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import type { CaseDraft } from "@/features/case/types/caseDraft";
import { applyCaseAnswer } from "@/features/case/utils/applyCaseAnswer";
import {
  analyzeCase,
  CaseApiError,
} from "@/features/case/services/apiCaseFlow";
import { colors, radius, spacing } from "@/theme/tokens";

function hasAnswer(value: CaseAnalysisAnswer["value"]) {
  return Array.isArray(value)
    ? value.length > 0
    : typeof value === "string"
      ? value.trim().length > 0
      : true;
}

export function QuestionsScreen() {
  const router = useRouter();
  const { draft, updateDraft, applyAnalysis, upsertAnswer } = useCaseDraft();
  const [answerValue, setAnswerValue] =
    useState<CaseAnalysisAnswer["value"]>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const requestedInitialAnalysis = useRef(false);
  const sortedQuestions = useMemo(
    () => [...draft.questions].sort((a, b) => a.order - b.order),
    [draft.questions],
  );
  const currentQuestion = sortedQuestions[0];

  async function runAnalysis(
    answers: CaseAnalysisAnswer[],
    sourceDraft: CaseDraft = draft,
  ) {
    setIsAnalyzing(true);
    setValidationError(null);

    try {
      const response = await analyzeCase({
        initialStatement: sourceDraft.initialStatement,
        countryCode: sourceDraft.countryCode,
        type: sourceDraft.type,
        lastSeenAt: sourceDraft.lastSeenAt,
        lastSeenPlace: sourceDraft.lastSeenPlace,
        discoveredAt: sourceDraft.discoveredAt,
        discoveredPlace: sourceDraft.discoveredPlace,
        estimatedOccurredAt: sourceDraft.estimatedOccurredAt,
        estimatedOccurredPlace: sourceDraft.estimatedOccurredPlace,
        routeAfterLastSeen: sourceDraft.routeAfterLastSeen,
        storageState: sourceDraft.storageState,
        description: sourceDraft.description,
        items: sourceDraft.items,
        answers,
      });

      applyAnalysis(response.data);
      setAnswerValue("");

      if (response.data.questions.length === 0) {
        router.push("/case/confirmation" as Href);
      }
    } catch (error) {
      const message =
        error instanceof CaseApiError
          ? error.message
          : "사건 내용을 분석하지 못했습니다. 다시 시도해 주세요.";
      updateDraft({ errorMessage: message });
    } finally {
      setIsAnalyzing(false);
    }
  }

  useEffect(() => {
    if (
      requestedInitialAnalysis.current ||
      draft.aiSummary !== null ||
      isAnalyzing
    ) {
      return;
    }

    requestedInitialAnalysis.current = true;
    void runAnalysis(draft.answers);
  }, [draft.aiSummary, draft.answers, isAnalyzing]);

  async function handleSubmitAnswer() {
    if (!currentQuestion) {
      if (draft.aiSummary === null) {
        await runAnalysis(draft.answers);
        return;
      }

      router.push("/case/confirmation" as Href);
      return;
    }

    if (currentQuestion.required && !hasAnswer(answerValue)) {
      setValidationError("필수 질문에 답변해 주세요.");
      return;
    }

    const normalizedValue =
      currentQuestion.answerType === "number" &&
      typeof answerValue === "string"
        ? Number(answerValue)
        : answerValue;
    const answer = {
      field: currentQuestion.field,
      value: normalizedValue,
    } satisfies CaseAnalysisAnswer;
    const nextAnswers = [
      ...draft.answers.filter((item) => item.field !== answer.field),
      answer,
    ];
    const answeredDraft = applyCaseAnswer(draft, answer);

    upsertAnswer(answer);
    await runAnalysis(nextAnswers, answeredDraft);
  }

  function toggleOption(option: string) {
    if (currentQuestion?.answerType !== "multiselect") {
      setAnswerValue(option);
      return;
    }

    const selected = Array.isArray(answerValue) ? answerValue : [];
    setAnswerValue(
      selected.includes(option)
        ? selected.filter((value) => value !== option)
        : [...selected, option],
    );
  }

  const options =
    currentQuestion?.answerType === "boolean"
      ? ["예", "아니요"]
      : currentQuestion?.options ?? [];

  return (
    <>
      <FlowHeader title="추가 질문" />
      <AppScreen
        footer={
          <Button
            title={
              currentQuestion
                ? "답변 제출"
                : draft.aiSummary === null
                  ? "다시 분석하기"
                  : "사건 내용 확인하기"
            }
            onPress={() => void handleSubmitAnswer()}
            loading={isAnalyzing}
            disabled={isAnalyzing}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.typeLabel}>
            사건 유형: {draft.type === "UNKNOWN" ? "알 수 없음" : draft.type}
          </Text>
          {currentQuestion ? (
            <View style={styles.card}>
              <Text style={styles.order}>
                질문 {currentQuestion.order + 1}
              </Text>
              <Text style={styles.question}>{currentQuestion.question}</Text>
              {options.length > 0 ? (
                <View style={styles.options}>
                  {options.map((option) => {
                    const selected = Array.isArray(answerValue)
                      ? answerValue.includes(option)
                      : answerValue === option ||
                        (currentQuestion.answerType === "boolean" &&
                          answerValue === (option === "예"));
                    return (
                      <Pressable
                        key={option}
                        onPress={() =>
                          currentQuestion.answerType === "boolean"
                            ? setAnswerValue(option === "예")
                            : toggleOption(option)
                        }
                        style={[styles.option, selected && styles.selectedOption]}
                      >
                        <Text style={styles.optionText}>{option}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : (
                <AppTextInput
                  label={currentQuestion.required ? "답변 (필수)" : "답변"}
                  value={typeof answerValue === "string" ? answerValue : ""}
                  onChangeText={setAnswerValue}
                  keyboardType={
                    currentQuestion.answerType === "number" ? "numeric" : "default"
                  }
                  placeholder="답변을 입력해 주세요."
                  error={validationError ?? undefined}
                />
              )}
              {options.length > 0 && validationError ? (
                <Text style={styles.error}>{validationError}</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.question}>추가 질문이 모두 완료되었습니다.</Text>
          )}
          {draft.errorMessage ? (
            <Text style={styles.error}>{draft.errorMessage}</Text>
          ) : null}
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  typeLabel: { color: colors.textSecondary, fontSize: 14 },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  order: { color: colors.primary, fontWeight: "700" },
  question: { color: colors.text, fontSize: 20, fontWeight: "700", lineHeight: 28 },
  options: { gap: spacing.sm },
  option: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionText: { color: colors.text, fontSize: 15 },
  error: { color: colors.error, fontSize: 14 },
});
