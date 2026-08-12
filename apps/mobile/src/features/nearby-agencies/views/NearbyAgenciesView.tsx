import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/tokens";

import { NearbyAgenciesViewShared } from "./NearbyAgenciesView.shared";
import type { NearbyAgenciesViewProps } from "./NearbyAgenciesView.types";

export function NearbyAgenciesView(props: NearbyAgenciesViewProps) {
  return (
    <View style={styles.page}>
      <View style={styles.content}>
        <NearbyAgenciesViewShared {...props} />
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
