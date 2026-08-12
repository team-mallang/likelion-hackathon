import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/tokens";

import { DirectionsViewShared } from "./DirectionsView.shared";
import type { DirectionsViewProps } from "./DirectionsView.types";

export function DirectionsView(props: DirectionsViewProps) {
  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <DirectionsViewShared {...props} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: "100%", alignItems: "center", backgroundColor: colors.surface },
  content: { flex: 1, width: "100%", maxWidth: 480, borderRightWidth: 1, borderLeftWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
});
