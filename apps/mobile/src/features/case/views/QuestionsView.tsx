import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { colors, radius, spacing } from "@/theme/tokens";

import type { QuestionsViewProps } from "./QuestionsView.types";

export function QuestionsView(props: QuestionsViewProps) {
  const { currentQuestion, currentAnswer, isSaving } = props;
  const hasQuestion = currentQuestion !== null;
  const isChoice = currentQuestion?.answerType === "boolean" || currentQuestion?.answerType === "select" || currentQuestion?.answerType === "multiselect";
  const options = currentQuestion?.answerType === "boolean" ? [true, false] : currentQuestion?.options ?? [];

  function select(value: string | boolean) {
    if (currentQuestion?.answerType !== "multiselect") return props.onAnswerChange(value);
    const selected = Array.isArray(currentAnswer) ? currentAnswer : [];
    props.onAnswerChange(selected.includes(value as string) ? selected.filter((item) => item !== value) : [...selected, value as string]);
  }

  return <>
    <FlowHeader onBack={props.onBack} title="추가 질문" />
    <ProgressBar progress={props.progress} />
    <AppScreen footer={<Button title={hasQuestion ? "답변 완료하고 분석하기" : "사건 정보 확인하기"} onPress={props.onSubmit} loading={isSaving} disabled={isSaving} />}>
      {hasQuestion ? <View style={styles.container}>
        <View style={styles.introduction}><Text style={styles.eyebrow}>AI 맞춤 질문</Text><Text style={styles.title}>몇 가지만 더 확인할게요</Text><Text style={styles.description}>이미 말씀해 주신 정보는 다시 묻지 않고, 아직 필요한 정보만 확인합니다.</Text></View>
        <Text style={styles.order}>{props.currentIndex + 1} / {props.totalCount}</Text>
        <View style={styles.card}>
          <Text style={styles.question}>{currentQuestion.question}</Text>
          {isChoice ? <View style={styles.options}>{options.map((option) => {
            const selected = Array.isArray(currentAnswer) ? currentAnswer.includes(option as string) : currentAnswer === option;
            return <Pressable key={String(option)} disabled={isSaving} onPress={() => select(option)} style={[styles.option, selected && styles.selected]}><Text style={styles.optionText}>{typeof option === "boolean" ? (option ? "예" : "아니오") : option}</Text></Pressable>;
          })}</View> : <AppTextInput label={currentQuestion.answerType === "datetime" ? "날짜 및 시간 (ISO 8601)" : "답변"} multiline={currentQuestion.answerType === "text"} editable={!isSaving} value={typeof currentAnswer === "string" ? currentAnswer : ""} onChangeText={props.onAnswerChange} keyboardType={currentQuestion.answerType === "number" ? "numeric" : "default"} placeholder={currentQuestion.answerType === "datetime" ? "2026-08-12T15:00:00+09:00" : "답변을 입력해 주세요"} style={currentQuestion.answerType === "text" ? styles.answerInput : undefined} textAlignVertical="top" />}
        </View>
        {isSaving ? <View style={styles.notice}><Text style={styles.noticeText}>답변을 반영해 다시 분석하고 있어요.</Text></View> : null}
        {props.errorMessage ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{props.errorMessage}</Text></View> : null}
      </View> : <View style={styles.empty}><Text style={styles.title}>추가 질문이 없습니다</Text>{props.errorMessage ? <Text style={styles.errorText}>{props.errorMessage}</Text> : null}</View>}
    </AppScreen>
  </>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg }, introduction: { gap: spacing.sm }, eyebrow: { color: colors.primary, fontSize: 13, fontWeight: "800" }, title: { color: colors.text, fontSize: 26, fontWeight: "800", lineHeight: 34 }, description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 }, order: { color: colors.primary, fontSize: 15, fontWeight: "800" }, card: { gap: spacing.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }, question: { color: colors.text, fontSize: 20, fontWeight: "800", lineHeight: 29 }, answerInput: { minHeight: 160, paddingTop: spacing.md, paddingBottom: spacing.md }, options: { gap: spacing.sm }, option: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }, selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, optionText: { color: colors.text, fontSize: 15 }, notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft }, noticeText: { color: colors.primary, fontWeight: "700" }, error: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.errorSoft }, errorText: { color: colors.error, fontSize: 14 }, empty: { flex: 1, justifyContent: "center", gap: spacing.md, paddingVertical: spacing.xl },
});
