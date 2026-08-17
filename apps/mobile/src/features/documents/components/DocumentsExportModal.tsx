import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { DocumentsExportRequest } from "@/features/documents/views/DocumentsView.types";
import { colors, radius, spacing } from "@/theme/tokens";

type Props = { visible: boolean; isExporting: boolean; onClose: () => void; onSubmit: (request: DocumentsExportRequest) => Promise<void> };

export function DocumentsExportModal({ visible, isExporting, onClose, onSubmit }: Props) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!visible) { setEmail(""); setError(null); } }, [visible]);
  async function submitEmail() {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setError("올바른 이메일 주소를 입력해 주세요."); return; }
    await onSubmit({ method: "EMAIL", email: value });
    onClose();
  }
  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <Pressable accessibilityLabel="내보내기 창 닫기" accessibilityRole="button" onPress={onClose} style={StyleSheet.absoluteFill} />
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.spacer} />
            <Text accessibilityRole="header" style={styles.title}>이메일로 보내기</Text>
            <Pressable accessibilityLabel="내보내기 창 닫기" accessibilityRole="button" onPress={onClose}><Ionicons color={colors.textSecondary} name="close" size={24} /></Pressable>
          </View>
          <View style={styles.content}>
            <Text style={styles.description}>사건 카드, 경찰 신고서 일본어 초안·한국어 확인본, 촬영 자료를 ZIP 파일로 첨부합니다.</Text>
            <Text style={styles.label}>받는 이메일 주소</Text>
            <TextInput autoCapitalize="none" autoCorrect={false} autoFocus keyboardType="email-address" onChangeText={(value) => { setEmail(value); setError(null); }} onSubmitEditing={submitEmail} placeholder="example@email.com" style={[styles.input, error && styles.inputError]} value={email} />
            {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="이메일 작성" onPress={submitEmail} />
          </View>
          {isExporting ? <Text style={styles.progress}>자료를 준비하고 있습니다...</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={styles.primary}><Text style={styles.primaryText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.md, backgroundColor: "rgba(15,23,42,.48)" },
  sheet: { width: "100%", maxWidth: 440, overflow: "hidden", borderRadius: radius.lg, backgroundColor: colors.background },
  header: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  spacer: { width: 24 }, title: { flex: 1, color: colors.text, fontSize: 18, fontWeight: "800", textAlign: "center" },
  content: { gap: spacing.md, padding: spacing.lg }, description: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, textAlign: "center" },
  label: { color: colors.text, fontSize: 14, fontWeight: "700" }, input: { minHeight: 52, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, color: colors.text, fontSize: 16 }, inputError: { borderColor: colors.error }, error: { color: colors.error, fontSize: 12 }, progress: { padding: spacing.md, color: colors.textSecondary, textAlign: "center" },
  primary: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.primary }, primaryText: { color: colors.background, fontSize: 16, fontWeight: "800" },
});
