import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { ScanStatus } from "@/features/document-scan/types/documentScan";
import { colors, radius, spacing } from "@/theme/tokens";

type DocumentCaptureGuideProps = {
  status: ScanStatus;
  isCameraSupported: boolean;
};

export function DocumentCaptureGuide({ status, isCameraSupported }: DocumentCaptureGuideProps) {
  const isWorking = status === "REQUESTING_PERMISSION" || status === "CAPTURING" || status === "ANALYZING";

  return (
    <View accessibilityLabel="신고서 촬영 영역" style={styles.frame}>
      <View style={styles.cornerTopLeft} />
      <View style={styles.cornerTopRight} />
      <View style={styles.cornerBottomLeft} />
      <View style={styles.cornerBottomRight} />
      <Ionicons accessibilityElementsHidden color={colors.textSecondary} name={isWorking ? "sync-outline" : "document-text-outline"} size={42} />
      <Text style={styles.guideTitle}>
        {isWorking ? "신고서를 준비하고 있습니다" : "신고서를 이 영역 안에 맞춰주세요"}
      </Text>
      <Text style={styles.guideDescription}>
        {isCameraSupported ? "문서 전체와 글자가 선명하게 보이도록 촬영해 주세요." : "이 기기에서는 파일 선택으로 신고서를 올릴 수 있습니다."}
      </Text>
    </View>
  );
}

const cornerBase = { position: "absolute" as const, width: 28, height: 28, borderColor: colors.primary };
const styles = StyleSheet.create({
  frame: { minHeight: 382, alignItems: "center", justifyContent: "center", gap: spacing.sm, marginHorizontal: spacing.md, paddingHorizontal: spacing.xl, borderWidth: 2, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background },
  cornerTopLeft: { ...cornerBase, top: spacing.md, left: spacing.md, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.sm },
  cornerTopRight: { ...cornerBase, top: spacing.md, right: spacing.md, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.sm },
  cornerBottomLeft: { ...cornerBase, bottom: spacing.md, left: spacing.md, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.sm },
  cornerBottomRight: { ...cornerBase, right: spacing.md, bottom: spacing.md, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: radius.sm },
  guideTitle: { color: colors.textSecondary, fontSize: 14, fontWeight: "800", textAlign: "center" },
  guideDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
