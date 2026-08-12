import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { DocumentCaptureGuide } from "@/features/document-scan/components/DocumentCaptureGuide";
import { getScanStatusLabel } from "@/features/document-scan/utils/documentScanDisplay";
import { colors, radius, spacing } from "@/theme/tokens";

import type { DocumentScanViewProps } from "./DocumentScanView.types";

export function DocumentScanViewShared(props: DocumentScanViewProps) {
  const isWorking = ["REQUESTING_PERMISSION", "CAPTURING", "ANALYZING"].includes(props.scanStatus);
  const isSuccess = props.scanStatus === "SUCCESS";
  const primaryLabel = isSuccess ? "경위서 초안 확인" : isWorking ? getScanStatusLabel(props.scanStatus) : "신고서 스캔하기";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="신고서 스캔에서 뒤로가기" accessibilityRole="button" hitSlop={12} onPress={props.onBack} style={styles.headerSide}>
          <Ionicons accessibilityElementsHidden color={colors.primary} name="arrow-back" size={26} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>분실·도난 신고</Text>
        <Text accessibilityLabel="신고 진행 단계 3 / 6" style={styles.progress}>3/6</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={styles.title}>양식이 없으신가요?</Text>
        <Text style={styles.description}>저장된 양식이 없어 실제 작성하신 신고서를 스캔해 주세요.</Text>
        <DocumentCaptureGuide isCameraSupported={props.isCameraSupported} status={props.scanStatus} />

        {props.errorMessage ? (
          <View accessibilityRole="alert" style={styles.errorNotice}>
            <Ionicons accessibilityElementsHidden color={colors.error} name="information-circle-outline" size={20} />
            <Text style={styles.errorText}>{props.errorMessage}</Text>
            {props.scanStatus === "FAILED" ? <Pressable accessibilityRole="button" accessibilityLabel="신고서 다시 스캔하기" onPress={props.onRetry}><Text style={styles.retryText}>다시 시도</Text></Pressable> : null}
          </View>
        ) : null}

        <View accessibilityLabel="문서 분석 안내" style={styles.infoCard}>
          <Ionicons accessibilityElementsHidden color={colors.primary} name="information-circle-outline" size={20} />
          <Text style={styles.infoText}>제공된 양식이 앱에 없다면 실제 작성하신 신고서를 촬영해 보세요. 문서 분석 결과로 경위서 초안을 준비합니다.</Text>
        </View>

        {isSuccess && props.result ? <Text accessibilityRole="summary" style={styles.successText}>추출된 정보를 바탕으로 경위서 초안을 확인할 수 있습니다.</Text> : null}
        <Pressable accessibilityHint={isSuccess ? "S09 경위서 초안 검토 화면으로 이동합니다." : "카메라 또는 파일 선택으로 신고서 스캔을 시작합니다."} accessibilityLabel={primaryLabel} accessibilityRole="button" accessibilityState={{ busy: isWorking, disabled: isWorking }} disabled={isWorking} onPress={isSuccess ? props.onReviewDraft : props.onStartScan} style={({ pressed }) => [styles.primaryButton, isWorking && styles.disabled, pressed && styles.pressed]}>
          <Ionicons accessibilityElementsHidden color={colors.background} name={isSuccess ? "document-text-outline" : "camera-outline"} size={21} />
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </Pressable>
        {!props.isCameraSupported ? <Pressable accessibilityRole="button" accessibilityLabel="카메라 권한 또는 파일 선택 설정 확인" onPress={props.onOpenSettings} style={styles.fallbackButton}><Text style={styles.fallbackText}>파일 선택 방법 보기</Text></Pressable> : null}
        <Text style={styles.tip}>팁: 밝은 곳에서 글자가 잘 보이게 촬영해 주세요.</Text>
      </ScrollView>
      <CaseBottomNavigation activeTab="documents" onCaseTab={props.onCaseTab} onDocumentsTab={props.onDocumentsTab} onGuideTab={props.onGuideTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { width: "100%", maxWidth: 480, minHeight: 60, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, borderBottomWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  headerSide: { width: 48, minHeight: 44, alignItems: "center", justifyContent: "center", cursor: "pointer" },
  headerTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: "900", textAlign: "center" },
  progress: { width: 48, color: colors.primary, fontSize: 15, fontWeight: "900", textAlign: "right" },
  content: { width: "100%", maxWidth: 480, flexGrow: 1, alignSelf: "center", padding: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  title: { color: colors.text, fontSize: 21, fontWeight: "900", textAlign: "center" },
  description: { marginTop: spacing.xs, marginBottom: spacing.lg, color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center" },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 19 },
  errorNotice: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.error, borderRadius: radius.md, backgroundColor: colors.errorSoft },
  errorText: { flex: 1, color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  successText: { marginTop: spacing.md, color: colors.primary, fontSize: 13, fontWeight: "700", textAlign: "center" },
  primaryButton: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.primary, cursor: "pointer" },
  primaryText: { color: colors.background, fontSize: 17, fontWeight: "900" },
  fallbackButton: { minHeight: 44, alignItems: "center", justifyContent: "center", cursor: "pointer" },
  fallbackText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  tip: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 11, textAlign: "center" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
