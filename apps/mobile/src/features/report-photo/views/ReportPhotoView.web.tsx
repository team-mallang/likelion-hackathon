import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/tokens";

import { ReportPhotoViewShared } from "./ReportPhotoView.shared";
import type { ReportPhotoViewProps } from "./ReportPhotoView.types";

export function ReportPhotoView(props: ReportPhotoViewProps) {
  return <View style={styles.page}><View style={styles.content}><ReportPhotoViewShared {...props} /></View></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%", alignItems: "center", backgroundColor: colors.surface },
  content: { flex: 1, width: "100%", maxWidth: 480, borderRightWidth: 1, borderLeftWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
});
