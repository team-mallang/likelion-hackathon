import { StyleSheet, Text, View } from "react-native";

import type { CaseGuidesViewProps } from "./CaseGuidesView.types";
import { Button } from "@/components/common/button";
import { colors, spacing } from "@/theme/tokens";

export function CaseGuidesView({ onBack }: CaseGuidesViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>행동 가이드</Text>
      <Text style={styles.description}>
        가이드 조회와 상태 화면은 다음 단계에서 연결합니다.
      </Text>
      <Button title="뒤로가기" variant="outline" onPress={onBack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.md, justifyContent: "center" },
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
});
