import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DirectionsTravelMode } from "@/features/directions/types/directions";
import { getTravelModeDisplay } from "@/features/directions/utils/directionDisplay";
import { colors, radius, spacing } from "@/theme/tokens";

type TravelModeSelectorProps = {
  availableModes: DirectionsTravelMode[];
  selectedMode: DirectionsTravelMode | null;
  onSelectMode: (mode: DirectionsTravelMode) => void;
};

const iconByMode = { WALK: "walk-outline", TRANSIT: "bus-outline", DRIVE: "car-outline" } as const;

export function TravelModeSelector({ availableModes, selectedMode, onSelectMode }: TravelModeSelectorProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="이동 수단 선택" style={styles.row}>
      {(["WALK", "TRANSIT", "DRIVE"] as const).map((mode) => {
        const supported = availableModes.includes(mode);
        const selected = selectedMode === mode;
        const display = getTravelModeDisplay(mode);

        return (
          <Pressable
            accessibilityLabel={display.accessibilityLabel}
            accessibilityRole="radio"
            accessibilityState={{ disabled: !supported, selected }}
            disabled={!supported}
            key={mode}
            onPress={() => onSelectMode(mode)}
            style={({ pressed }) => [styles.option, selected && styles.optionSelected, !supported && styles.optionDisabled, pressed && styles.pressed]}
          >
            <Ionicons accessibilityElementsHidden color={selected ? colors.background : colors.textSecondary} name={iconByMode[mode]} size={19} />
            <Text style={[styles.label, selected && styles.labelSelected]}>{display.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md },
  option: { minHeight: 48, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: radius.sm, backgroundColor: colors.primarySoft, cursor: "pointer" },
  optionSelected: { backgroundColor: colors.primary },
  optionDisabled: { opacity: 0.45 },
  label: { color: colors.text, fontSize: 13, fontWeight: "800" },
  labelSelected: { color: colors.background },
  pressed: { opacity: 0.72 },
});
