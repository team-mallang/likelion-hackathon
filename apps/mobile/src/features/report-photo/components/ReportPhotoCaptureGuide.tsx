import { Ionicons } from "@expo/vector-icons";
import { Image, StyleSheet, Text, View } from "react-native";

import type { ReportPhotoStatus } from "@/features/report-photo/types/reportPhoto";
import { colors, radius, spacing } from "@/theme/tokens";

type ReportPhotoCaptureGuideProps = {
  status: ReportPhotoStatus;
  hasPhoto: boolean;
  photoUri?: string;
};

export function ReportPhotoCaptureGuide({ status, hasPhoto, photoUri }: ReportPhotoCaptureGuideProps) {
  const isWorking = status === "REQUESTING_PERMISSION" || status === "CAPTURING" || status === "SELECTING";

  return (
    <View accessibilityLabel={hasPhoto ? "선택한 신고서 사진 미리보기" : "신고서 촬영 가이드"} style={[styles.frame, hasPhoto && styles.previewFrame]}>
      <View style={styles.cornerTopLeft} />
      <View style={styles.cornerTopRight} />
      <View style={styles.cornerBottomLeft} />
      <View style={styles.cornerBottomRight} />
      {hasPhoto && photoUri ? <Image accessibilityLabel="선택한 신고서 사진 미리보기" resizeMode="contain" source={{ uri: photoUri }} style={styles.previewImage} /> : <Ionicons accessibilityElementsHidden color={colors.textSecondary} name={isWorking ? "sync-outline" : "document-text-outline"} size={48} />}
      <Text style={styles.title}>
        {hasPhoto ? "사진을 확인해 주세요" : isWorking ? "사진을 준비하고 있습니다" : "신고서 전체가 잘 보이도록 촬영해 주세요."}
      </Text>
      <Text style={styles.description}>
        {hasPhoto ? "문서가 잘리지 않았는지 확인한 뒤 저장/공유를 선택해 주세요." : "밝은 곳에서 신고서 전체와 글자가 선명하게 보이게 해 주세요."}
      </Text>
    </View>
  );
}

const corner = { position: "absolute" as const, width: 28, height: 28, borderColor: colors.primary };
const styles = StyleSheet.create({
  frame: { minHeight: 390, alignItems: "center", justifyContent: "center", gap: spacing.sm, marginHorizontal: spacing.md, paddingHorizontal: spacing.xl, borderWidth: 2, borderStyle: "dashed", borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface },
  previewFrame: { borderStyle: "solid", borderColor: colors.primarySoft, backgroundColor: colors.primarySoft },
  previewImage: { width: "100%", height: 250, borderRadius: radius.md },
  cornerTopLeft: { ...corner, top: spacing.md, left: spacing.md, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: radius.sm },
  cornerTopRight: { ...corner, top: spacing.md, right: spacing.md, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: radius.sm },
  cornerBottomLeft: { ...corner, bottom: spacing.md, left: spacing.md, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: radius.sm },
  cornerBottomRight: { ...corner, right: spacing.md, bottom: spacing.md, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: radius.sm },
  title: { color: colors.text, fontSize: 16, fontWeight: "900", textAlign: "center" },
  description: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: "center" },
});
