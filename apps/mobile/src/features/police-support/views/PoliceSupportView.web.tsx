import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/tokens";

import { PoliceSupportViewShared } from "./PoliceSupportView.shared";
import type { PoliceSupportViewProps } from "./PoliceSupportView.types";

export function PoliceSupportView(props: PoliceSupportViewProps) {
  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <PoliceSupportViewShared {...props} />
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
