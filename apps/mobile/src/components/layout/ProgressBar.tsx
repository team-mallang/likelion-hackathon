import { StyleSheet, View } from "react-native";

import { colors } from "@/theme/tokens";

type ProgressBarProps = {
  progress: number;
};

export function ProgressBar({ progress }: ProgressBarProps) {
  const normalizedProgress = Math.min(Math.max(progress, 0), 1);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(normalizedProgress * 100),
      }}
      style={styles.track}
    >
      <View
        style={[
          styles.value,
          {
            width: `${normalizedProgress * 100}%`,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    overflow: "hidden",
    backgroundColor: colors.border,
  },
  value: {
    height: "100%",
    backgroundColor: colors.primary,
  },
});