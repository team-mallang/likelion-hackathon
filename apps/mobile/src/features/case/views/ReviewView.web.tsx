import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";

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
      <FlowHeader
        onBack={onBack}
        step="3/6"
        title="말씀해주신 내용이 맞나요?"
      />
      <ProgressBar progress={3 / 6} />

      <AppScreen
        footer={
          <View style={styles.footerContent}>
            <Button
              title={
                errorMessage ? "다시 분석하기" : "▣  이 내용으로 분석하기"
              }
              onPress={onAnalyze}
              disabled={!canAnalyze}
              loading={isAnalyzing}
            />
          </View>
        }
      >
        <View style={styles.container}>
          <View style={styles.transcriptSection}>
            <Text style={styles.sectionLabel}>녹음된 내용</Text>

            <View style={styles.transcriptCard}>
              {isEditingStatement ? (
                <AppTextInput
                  label="녹음된 내용 수정"
                  multiline
                  onChangeText={onStatementChange}
                  placeholder="사건 내용을 입력해 주세요."
                  style={styles.statementInput}
                  textAlignVertical="top"
                  value={statement}
                />
              ) : (
                <>
                  <Text style={styles.statement}>
                    {statement || "입력된 사건 내용이 없습니다."}
                  </Text>
                  <Pressable
                    accessibilityLabel="녹음된 내용 수정"
                    accessibilityRole="button"
                    onPress={onStatementEditToggle}
                    style={({ pressed }) => [
                      styles.editButton,
                      pressed && styles.editButtonPressed,
                    ]}
                  >
                    <Text style={styles.editMark}>✎</Text>
                  </Pressable>
                </>
              )}
            </View>

            <View style={styles.actionRows}>
              <View style={styles.actionRow}>
                <View style={styles.actionButton}>
                  <Button
                    title="♩  다시 녹음하기"
                    onPress={onRecordAgain}
                    variant="outline"
                  />
                </View>
                <View style={styles.actionButton}>
                  <Button
                    title={
                      isEditingLocation
                        ? "위치 수정 완료"
                        : "⌾  현재 위치 수정"
                    }
                    onPress={onLocationEditToggle}
                    variant="outline"
                  />
                </View>
              </View>

              <View style={styles.actionRow}>
                <View style={styles.actionButton}>
                  <Button
                    title={
                      isEditingTime ? "시간 수정 완료" : "◷  발생 시간 수정"
                    }
                    onPress={onTimeEditToggle}
                    variant="outline"
                  />
                </View>
              </View>
            </View>
          </View>

          {isEditingLocation || isEditingTime ? (
            <View style={styles.detailEditor}>
              {isEditingLocation ? (
                <AppTextInput
                  label="사건 발생 위치"
                  onChangeText={onLocationChange}
                  placeholder="사건이 발생한 위치를 입력해 주세요."
                  value={locationText}
                />
              ) : null}

              {isEditingTime ? (
                <AppTextInput
                  label="사건 발생 시간"
                  onChangeText={onOccurredAtChange}
                  placeholder="사건이 발생한 시간을 입력해 주세요."
                  value={occurredAtText}
                />
              ) : null}
            </View>
          ) : null}

          <View style={styles.analysisCard}>
            <View style={styles.infoIconCircle}>
              <Text style={styles.infoIcon}>i</Text>
            </View>
            <View style={styles.analysisCopy}>
              <Text style={styles.analysisTitle}>AI 분석 안내</Text>
              <Text style={styles.analysisDescription}>
                작성된 내용을 바탕으로 일본 경찰서 제출용
                <Text style={styles.analysisEmphasis}>
                  {" "}
                  {expectedCaseTypeLabel} 초안
                </Text>
                을 자동으로 구성합니다.
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
          </View>

          {errorMessage ? (
            <View accessibilityRole="alert" style={styles.errorCard}>
              <Text style={styles.errorTitle}>분석하지 못했습니다</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <Text style={styles.errorGuide}>
                입력한 내용은 유지됩니다. 내용을 확인한 뒤 다시 시도해
                주세요.
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
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 20,
    paddingBottom: 24,
  },
  transcriptSection: {
    gap: 10,
  },
  sectionLabel: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "800",
  },
  transcriptCard: {
    position: "relative",
    minHeight: 132,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 38,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  statement: {
    color: "#374151",
    fontSize: 16,
    lineHeight: 25,
  },
  editButton: {
    position: "absolute",
    right: 16,
    bottom: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  editButtonPressed: {
    backgroundColor: "#EAF2FF",
  },
  editMark: {
    color: "#2563EB",
    fontSize: 20,
    fontWeight: "800",
  },
  statementInput: {
    minHeight: 110,
    paddingTop: 12,
    paddingBottom: 12,
  },
  actionRows: {
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    minWidth: 150,
  },
  detailEditor: {
    gap: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#DBE3F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  analysisCard: {
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 12,
    backgroundColor: "#EEF3FF",
  },
  infoIconCircle: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "#DCE8FF",
  },
  infoIcon: {
    color: "#2563EB",
    fontSize: 18,
    fontWeight: "900",
  },
  analysisCopy: {
    flex: 1,
    gap: 4,
  },
  analysisTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "800",
  },
  analysisDescription: {
    color: "#64748B",
    fontSize: 14,
    lineHeight: 22,
  },
  analysisEmphasis: {
    color: "#2563EB",
    fontWeight: "800",
  },
  analysisStatus: {
    marginTop: 6,
    color: "#2563EB",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 20,
  },
  errorCard: {
    gap: 4,
    padding: 16,
    borderRadius: 12,
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
});
