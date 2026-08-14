import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CaseAnalysisAnswer, CaseAnalysisQuestion } from "@project/shared";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { colors, radius, spacing } from "@/theme/tokens";

import type { QuestionsViewProps } from "./QuestionsView.types";

function QuestionInput({ question, value, disabled, onChange }: { question: CaseAnalysisQuestion; value: CaseAnalysisAnswer["value"] | undefined; disabled: boolean; onChange: (value: CaseAnalysisAnswer["value"]) => void }) {
  const isChoice = question.answerType === "boolean" || question.answerType === "select" || question.answerType === "multiselect";
  const options = question.answerType === "boolean" ? [true, false] : question.options;
  const select = (option: string | boolean) => {
    if (question.answerType !== "multiselect") return onChange(option);
    const selected = Array.isArray(value) ? value : [];
    onChange(selected.includes(option as string) ? selected.filter((item) => item !== option) : [...selected, option as string]);
  };
  return <View style={styles.card}><Text style={styles.question}>{question.question}</Text>{isChoice ? <View style={styles.options}>{options.map((option) => { const selected = Array.isArray(value) ? value.includes(option as string) : value === option; return <Pressable key={String(option)} disabled={disabled} onPress={() => select(option)} style={[styles.option, selected && styles.selected]}><Text style={styles.optionText}>{typeof option === "boolean" ? (option ? "예" : "아니요") : option}</Text></Pressable>; })}</View> : <AppTextInput label={question.answerType === "datetime" ? "날짜 및 시간 (ISO 8601)" : "답변"} multiline={question.answerType === "text"} editable={!disabled} value={typeof value === "string" ? value : ""} onChangeText={onChange} keyboardType={question.answerType === "number" ? "numeric" : "default"} placeholder={question.answerType === "datetime" ? "2026-08-12T15:00:00+09:00" : "답변을 입력해 주세요"} style={question.answerType === "text" ? styles.answerInput : undefined} textAlignVertical="top" />}</View>;
}

export function QuestionsView(props: QuestionsViewProps) {
  const caseQuestions = props.questions.filter((question) => !question.field.startsWith("items["));
  const groups = new Map<number, CaseAnalysisQuestion[]>();
  for (const question of props.questions.filter((item) => item.field.startsWith("items["))) { const match = /^items\[(\d+)]/.exec(question.field); if (match) { const index = Number(match[1]); groups.set(index, [...(groups.get(index) ?? []), question]); } }
  return <><FlowHeader onBack={props.onBack} title="추가 정보 입력" /><ProgressBar progress={props.progress} /><AppScreen footer={<Button title={props.questions.length ? "입력 완료" : "사건 정보 확인하기"} onPress={props.onSubmit} loading={props.isSaving} disabled={props.isSaving} />}>{props.questions.length ? <View style={styles.container}><View style={styles.introduction}><Text style={styles.eyebrow}>AI 추가 정보</Text><Text style={styles.title}>부족한 정보만 입력해 주세요</Text><Text style={styles.description}>이미 전달한 내용은 다시 묻지 않습니다.</Text></View>{caseQuestions.length ? <View style={styles.section}><Text style={styles.sectionTitle}>사건 추가 정보</Text>{caseQuestions.map((question) => <QuestionInput key={question.field} question={question} value={props.answers[question.field]} disabled={props.isSaving} onChange={(value) => props.onAnswerChange(question.field, value)} />)}</View> : null}{[...groups.entries()].map(([index, questions]) => <View key={index} style={styles.section}><Text style={styles.sectionTitle}>물품 {index + 1} 추가 정보</Text>{questions.map((question) => <QuestionInput key={question.field} question={question} value={props.answers[question.field]} disabled={props.isSaving} onChange={(value) => props.onAnswerChange(question.field, value)} />)}</View>)}{props.errorMessage ? <View accessibilityRole="alert" style={styles.error}><Text style={styles.errorText}>{props.errorMessage}</Text></View> : null}</View> : <View style={styles.empty}><Text style={styles.title}>추가 정보가 없습니다</Text>{props.errorMessage ? <Text style={styles.errorText}>{props.errorMessage}</Text> : null}</View>}</AppScreen></>;
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg }, introduction: { gap: spacing.sm }, eyebrow: { color: colors.primary, fontSize: 13, fontWeight: "800" }, title: { color: colors.text, fontSize: 26, fontWeight: "800", lineHeight: 34 }, description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 }, section: { gap: spacing.md }, sectionTitle: { color: colors.text, fontSize: 20, fontWeight: "800" }, card: { gap: spacing.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }, question: { color: colors.text, fontSize: 20, fontWeight: "800", lineHeight: 29 }, answerInput: { minHeight: 160, paddingTop: spacing.md, paddingBottom: spacing.md }, options: { gap: spacing.sm }, option: { padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md }, selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, optionText: { color: colors.text, fontSize: 15 }, error: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.errorSoft }, errorText: { color: colors.error, fontSize: 14 }, empty: { flex: 1, justifyContent: "center", gap: spacing.md, paddingVertical: spacing.xl },
});
