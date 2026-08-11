import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/tokens";

import { DocumentsViewShared } from "./DocumentsView.shared";
import type { DocumentsViewProps } from "./DocumentsView.types";

export function DocumentsView(props: DocumentsViewProps) {
  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <DocumentsViewShared {...props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    width: "100%",
    maxWidth: 480,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
});
