import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { ReportPhotoCaptureGuide } from "@/features/report-photo/components/ReportPhotoCaptureGuide";
import { getReportPhotoStatusLabel } from "@/features/report-photo/utils/reportPhotoDisplay";
import { colors, radius, spacing } from "@/theme/tokens";

import type { ReportPhotoViewProps } from "./ReportPhotoView.types";

export function ReportPhotoViewShared(props: ReportPhotoViewProps) {
  const hasPhoto = Boolean(props.photo);
  const isWorking = ["REQUESTING_PERMISSION", "CAPTURING", "SELECTING", "EXPORTING"].includes(props.captureStatus);
  const isPreview = props.captureStatus === "PREVIEW" || props.captureStatus === "EXPORTING" || props.captureStatus === "COMPLETED";
  const isCompleted = props.captureStatus === "COMPLETED";
  const isFailed = props.captureStatus === "FAILED";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="신고서 사진 등록에서 뒤로가기" accessibilityRole="button" hitSlop={12} onPress={props.onBack} style={styles.headerSide}>
          <Ionicons accessibilityElementsHidden color={colors.primary} name="arrow-back" size={28} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>신고서 사진 등록</Text>
        <View style={styles.headerSide} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View accessibilityLabel={`사진 등록 상태 ${getReportPhotoStatusLabel(props.captureStatus)}`} style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: isPreview ? "100%" : hasPhoto ? "66%" : "34%" }]} />
        </View>
        <ReportPhotoCaptureGuide hasPhoto={hasPhoto} photoUri={props.photo?.uri} status={props.captureStatus} />

        {props.errorMessage ? (
          <View accessibilityRole="alert" style={styles.errorNotice}>
            <Ionicons accessibilityElementsHidden color={colors.error} name="information-circle-outline" size={20} />
            <Text style={styles.errorText}>{props.errorMessage}</Text>
            {isFailed ? <Pressable accessibilityLabel="신고서 사진 다시 시도" accessibilityRole="button" onPress={props.onRetry}><Text style={styles.retryText}>다시 시도</Text></Pressable> : null}
          </View>
        ) : null}

        <View accessibilityLabel="사진 저장 안내" style={styles.infoCard}>
          <Ionicons accessibilityElementsHidden color={colors.primary} name="information-circle-outline" size={21} />
          <View style={styles.infoBody}>
            <Text style={styles.infoTitle}>사진 저장 안내</Text>
            <Text style={styles.infoText}>촬영하거나 선택한 신고서 사진은 앱 서버에 저장되지 않습니다. 내용을 확인한 뒤 기기의 사진 또는 파일 저장 기능을 이용해 직접 보관해 주세요.</Text>
          </View>
        </View>

        {!hasPhoto && !isCompleted ? (
          <View style={styles.actionRow}>
            <Pressable accessibilityHint="기기 카메라를 열어 신고서 사진을 촬영합니다." accessibilityLabel="사진 촬영" accessibilityRole="button" accessibilityState={{ busy: isWorking, disabled: isWorking || !props.isCameraSupported }} disabled={isWorking || !props.isCameraSupported} onPress={props.onCapture} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, (!props.isCameraSupported || isWorking) && styles.disabled]}>
              <Ionicons accessibilityElementsHidden color={colors.background} name="camera-outline" size={22} />
              <Text style={styles.primaryText}>사진 촬영</Text>
            </Pressable>
            <Pressable accessibilityHint="기기 갤러리 또는 파일에서 신고서 사진을 선택합니다." accessibilityLabel="갤러리에서 선택" accessibilityRole="button" accessibilityState={{ busy: isWorking, disabled: isWorking || !props.isFileSelectionSupported }} disabled={isWorking || !props.isFileSelectionSupported} onPress={props.onSelectFile} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, (!props.isFileSelectionSupported || isWorking) && styles.disabled]}>
              <Ionicons accessibilityElementsHidden color={colors.text} name="image-outline" size={22} />
              <Text style={styles.secondaryText}>갤러리에서 선택</Text>
            </Pressable>
          </View>
        ) : null}

        {hasPhoto && !isCompleted ? (
          <View style={styles.actionColumn}>
            <Pressable accessibilityLabel="사진 확인" accessibilityHint="촬영한 신고서 사진과 문서 정보를 확인합니다." accessibilityRole="button" accessibilityState={{ busy: isWorking }} disabled={isWorking} onPress={props.onReview} style={({ pressed }) => [styles.secondaryButton, styles.fullButton, pressed && styles.pressed, isWorking && styles.disabled]}><Ionicons accessibilityElementsHidden color={colors.primary} name="document-text-outline" size={22} /><Text style={styles.outlineText}>사진 확인</Text></Pressable>
            <Pressable accessibilityHint="OS 사진·파일 저장 또는 공유 기능을 엽니다." accessibilityLabel="기기에 저장 또는 공유" accessibilityRole="button" accessibilityState={{ busy: isWorking }} disabled={isWorking} onPress={props.onExport} style={({ pressed }) => [styles.primaryButton, styles.fullButton, pressed && styles.pressed, isWorking && styles.disabled]}>
              <Ionicons accessibilityElementsHidden color={colors.background} name="share-outline" size={22} />
              <Text style={styles.primaryText}>{isWorking ? getReportPhotoStatusLabel(props.captureStatus) : "기기에 저장/공유"}</Text>
            </Pressable>
            <Pressable accessibilityLabel="다시 촬영 또는 다른 사진 선택" accessibilityRole="button" disabled={isWorking} onPress={props.onDiscard} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed, isWorking && styles.disabled]}>
              <Text style={styles.outlineText}>다시 촬영 또는 다른 사진 선택</Text>
            </Pressable>
          </View>
        ) : null}

        {isCompleted ? <Pressable accessibilityHint="S09 또는 S07로 돌아갑니다." accessibilityLabel="등록 완료하고 돌아가기" accessibilityRole="button" onPress={props.onBack} style={({ pressed }) => [styles.primaryButton, styles.fullButton, pressed && styles.pressed]}><Text style={styles.primaryText}>등록 완료</Text></Pressable> : null}
        <Text style={styles.tip}>{hasPhoto ? "사진에 이름·주소·연락처가 포함될 수 있으니 저장 위치를 확인해 주세요." : "팁: 밝은 곳에서 신고서 전체가 잘 보이게 촬영해 주세요."}</Text>
      </ScrollView>
      <CaseBottomNavigation activeTab="documents" onCaseTab={props.onCaseTab} onDocumentsTab={props.onDocumentsTab} onGuideTab={props.onGuideTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { width: "100%", maxWidth: 480, minHeight: 64, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, backgroundColor: colors.background },
  headerSide: { width: 48, minHeight: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: colors.primary, fontSize: 22, fontWeight: "900", textAlign: "center" },
  content: { width: "100%", maxWidth: 480, flexGrow: 1, alignSelf: "center", paddingTop: spacing.md, paddingBottom: spacing.xl },
  progressTrack: { height: 10, marginHorizontal: spacing.lg, marginBottom: spacing.lg, overflow: "hidden", borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  progressFill: { height: "100%", borderRadius: radius.lg, backgroundColor: colors.primary },
  actionRow: { flexDirection: "row", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.lg },
  actionColumn: { gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.lg },
  primaryButton: { minHeight: 56, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.primary, cursor: "pointer" },
  secondaryButton: { minHeight: 56, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background, cursor: "pointer" },
  fullButton: { flex: 0 },
  outlineButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, cursor: "pointer" },
  primaryText: { color: colors.background, fontSize: 16, fontWeight: "900" },
  secondaryText: { color: colors.text, fontSize: 14, fontWeight: "800" },
  outlineText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  infoBody: { flex: 1, gap: spacing.xs },
  infoTitle: { color: colors.primary, fontSize: 15, fontWeight: "900" },
  infoText: { color: colors.textSecondary, fontSize: 12, lineHeight: 19 },
  errorNotice: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.error, borderRadius: radius.md, backgroundColor: colors.errorSoft },
  errorText: { flex: 1, color: colors.error, fontSize: 13, lineHeight: 19 },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  tip: { marginHorizontal: spacing.md, marginTop: spacing.sm, color: colors.textSecondary, fontSize: 11, lineHeight: 17, textAlign: "center" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});
