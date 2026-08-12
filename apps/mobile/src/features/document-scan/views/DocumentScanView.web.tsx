import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/tokens";

import { DocumentScanViewShared } from "./DocumentScanView.shared";
import type { DocumentScanViewProps } from "./DocumentScanView.types";

export function DocumentScanView(props: DocumentScanViewProps) {
  return <View style={styles.page}><View style={styles.content}><DocumentScanViewShared {...props} /></View></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%", alignItems: "center", backgroundColor: colors.surface },
  content: { flex: 1, width: "100%", maxWidth: 480, borderRightWidth: 1, borderLeftWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
});
