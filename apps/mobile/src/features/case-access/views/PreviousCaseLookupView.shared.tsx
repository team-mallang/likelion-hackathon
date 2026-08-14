import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "@/components/common/button";
import { colors, radius, spacing } from "@/theme/tokens";

import type { PreviousCaseLookupViewProps } from "./PreviousCaseLookupView.types";

export function PreviousCaseLookupView({
  caseNumber,
  password,
  isPasswordVisible,
  caseNumberError,
  passwordError,
  submissionError,
  canSubmit,
  isSubmitting,
  onBack,
  onChangeCaseNumber,
  onChangePassword,
  onTogglePasswordVisibility,
  onSubmit,
  onStartNewCase,
  onCaseTab,
  onGuideTab,
  onDocumentsTab,
}: PreviousCaseLookupViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.screen}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="뒤로가기"
            accessibilityRole="button"
            hitSlop={10}
            onPress={onBack}
            style={styles.headerSide}
          >
            <Ionicons color={colors.primary} name="arrow-back" size={24} />
          </Pressable>
          <Text style={styles.headerTitle}>분실·도난 신고</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introduction}>
            <Text style={styles.title}>이전 사건을 불러올게요</Text>
            <Text style={styles.description}>
              신고할 때 발급받은 사건번호와 비밀번호를 입력해주세요.
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              accessibilityLabel="사건번호 입력"
              error={caseNumberError}
              label="사건번호 입력"
              onChangeText={onChangeCaseNumber}
              placeholder="예: KR2026-AB12"
              editable={!isSubmitting}
              value={caseNumber}
            />
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>비밀번호 입력</Text>
              <View style={[styles.passwordInputRow, passwordError && styles.inputError]}>
                <TextInput
                  accessibilityLabel="비밀번호 입력"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isSubmitting}
                  onChangeText={onChangePassword}
                  placeholder="신고 시 설정한 비밀번호"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!isPasswordVisible}
                  style={styles.passwordInput}
                  textContentType="password"
                  value={password}
                />
                <Pressable
                  accessibilityLabel={isPasswordVisible ? "비밀번호 숨기기" : "비밀번호 보기"}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isSubmitting }}
                  disabled={isSubmitting}
                  onPress={onTogglePasswordVisibility}
                  style={styles.visibilityButton}
                >
                  <Ionicons
                    color={colors.textSecondary}
                    name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                    size={22}
                  />
                </Pressable>
              </View>
              {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
            </View>
          </View>

          {submissionError ? (
            <Text accessibilityRole="alert" style={styles.submissionError}>
              {submissionError}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Button
              disabled={!canSubmit || isSubmitting}
              loading={isSubmitting}
              onPress={onSubmit}
              title="사건 불러오기"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isSubmitting }}
              disabled={isSubmitting}
              onPress={onStartNewCase}
              style={styles.newCaseButton}
            >
              <Text style={styles.newCaseText}>새로운 사건 시작하기</Text>
            </Pressable>
          </View>

          <NoticeCard
            icon="warning-outline"
            style="warning"
            text="사건번호와 비밀번호를 잃어버린 경우 기존 사건을 복구하기 어려워요. 보안을 위해 별도의 찾기 기능을 제공하지 않습니다."
          />
          <NoticeCard
            icon="shield-checkmark-outline"
            title="데이터보호 및 보관 정책"
            text="입력된 정보는 보호 정책에 따라 관리됩니다. 사건의 보관 기간과 자동 삭제 기준은 운영 정책을 확인해 주세요."
          />
        </ScrollView>

        <View style={styles.bottomNavigation}>
          <Tab icon="warning-outline" label="사건" onPress={onCaseTab} />
          <Tab icon="book-outline" label="가이드" onPress={onGuideTab} />
          <Tab active icon="document-text-outline" label="서류" onPress={onDocumentsTab} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  accessibilityLabel,
  error,
  label,
  onChangeText,
  placeholder,
  editable,
  value,
}: {
  accessibilityLabel: string;
  error: string | null;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable: boolean;
  value: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, error && styles.inputError]}
        value={value}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function NoticeCard({
  icon,
  style = "default",
  text,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  style?: "default" | "warning";
  text: string;
  title?: string;
}) {
  const isWarning = style === "warning";

  return (
    <View style={[styles.noticeCard, isWarning && styles.warningCard]}>
      <Ionicons
        color={isWarning ? colors.error : colors.primary}
        name={icon}
        size={20}
      />
      <View style={styles.noticeTextArea}>
        {title ? <Text style={styles.noticeTitle}>{title}</Text> : null}
        <Text style={[styles.noticeText, isWarning && styles.warningText]}>{text}</Text>
      </View>
    </View>
  );
}

function Tab({
  active = false,
  icon,
  label,
  onPress,
}: {
  active?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tab, active && styles.activeTab]}
    >
      <Ionicons color={active ? colors.background : colors.textSecondary} name={icon} size={19} />
      <Text style={[styles.tabLabel, active && styles.activeTabLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 52,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  headerSide: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  content: { width: "100%", maxWidth: 480, alignSelf: "center", flexGrow: 1, gap: spacing.lg, padding: spacing.md },
  introduction: { gap: spacing.sm },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 32 },
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  form: { gap: spacing.md },
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 14, fontWeight: "700" },
  input: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.primarySoft, color: colors.text, paddingHorizontal: spacing.md },
  passwordInputRow: { minHeight: 52, alignItems: "center", flexDirection: "row", borderRadius: radius.md, backgroundColor: colors.primarySoft },
  passwordInput: { flex: 1, color: colors.text, paddingHorizontal: spacing.md },
  visibilityButton: { width: 48, minHeight: 52, alignItems: "center", justifyContent: "center" },
  inputError: { borderWidth: 1, borderColor: colors.error },
  error: { color: colors.error, fontSize: 13 },
  submissionError: { color: colors.error, fontSize: 14, lineHeight: 20 },
  actions: { gap: spacing.sm },
  newCaseButton: { minHeight: 44, alignItems: "center", justifyContent: "center" },
  newCaseText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  noticeCard: { flexDirection: "row", gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.background, padding: spacing.md },
  warningCard: { backgroundColor: colors.errorSoft },
  noticeTextArea: { flex: 1, gap: spacing.xs },
  noticeTitle: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  noticeText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  warningText: { color: colors.error },
  bottomNavigation: { width: "100%", maxWidth: 480, alignSelf: "center", flexDirection: "row", gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tab: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", gap: 2, borderRadius: radius.md },
  activeTab: { backgroundColor: colors.primary },
  tabLabel: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  activeTabLabel: { color: colors.background },
});
