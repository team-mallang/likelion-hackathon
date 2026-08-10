import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button } from "@/components/common/button";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { colors, radius, spacing } from "@/theme/tokens";

import type { CaseAccessViewProps } from "./CaseAccessView.types";

export function CaseAccessView({
  caseNumber,
  password,
  passwordConfirmation,
  isPasswordVisible,
  isPasswordConfirmationVisible,
  isCopied,
  isSubmitting,
  isComplete,
  canSubmit,
  passwordErrorMessage,
  passwordConfirmationErrorMessage,
  errorMessage,
  onBack,
  onCopyCaseNumber,
  onPasswordChange,
  onPasswordConfirmationChange,
  onPasswordVisibilityToggle,
  onPasswordConfirmationVisibilityToggle,
  onSubmit,
}: CaseAccessViewProps) {
  const hasCaseNumber = caseNumber.length > 0;
  const submitButtonTitle = isComplete
    ? "비밀번호 설정 완료"
    : canSubmit
      ? "저장하고 가이드 시작하기  →"
      : "비밀번호 확인하고 저장하기  →";

  return (
    <>
      <FlowHeader onBack={onBack} title="분실·도난 신고" />

      <AppScreen
        footer={
          <Button
            title={submitButtonTitle}
            onPress={onSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || isComplete || !hasCaseNumber}
          />
        }
      >
        <View style={styles.container}>
          <View style={styles.hero}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
            <Text style={styles.title}>사건이 안전하게 저장됐어요</Text>
            <Text style={styles.description}>
              나중에 이 내용을 다시 확인하려면{"\n"}
              사건번호와 비밀번호가 필요해요.
            </Text>
          </View>

          <View style={styles.caseNumberCard}>
            <View style={styles.caseNumberText}>
              <Text style={styles.caseNumberLabel}>발급 번호</Text>
              <Text selectable style={styles.caseNumber}>
                {caseNumber || "발급된 사건번호가 없습니다"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={
                isCopied ? "사건번호 복사됨" : "사건번호 복사"
              }
              accessibilityRole="button"
              disabled={!hasCaseNumber}
              onPress={onCopyCaseNumber}
              style={({ pressed }) => [
                styles.copyButton,
                pressed && styles.pressed,
                !hasCaseNumber && styles.disabled,
              ]}
            >
              <Text style={styles.copyIcon}>▣</Text>
              <Text style={styles.copyButtonText}>
                {isCopied ? "복사됨" : "복사"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.passwordSection}>
            <PasswordInput
              label="비밀번호 설정"
              value={password}
              placeholder="비밀번호 입력"
              isVisible={isPasswordVisible}
              editable={!isSubmitting && !isComplete}
              errorMessage={passwordErrorMessage}
              onChangeText={onPasswordChange}
              onVisibilityToggle={onPasswordVisibilityToggle}
            />

            <PasswordInput
              label="비밀번호 확인"
              value={passwordConfirmation}
              placeholder="비밀번호 다시 입력"
              isVisible={isPasswordConfirmationVisible}
              editable={!isSubmitting && !isComplete}
              errorMessage={passwordConfirmationErrorMessage}
              onChangeText={onPasswordConfirmationChange}
              onVisibilityToggle={
                onPasswordConfirmationVisibilityToggle
              }
            />

            <Text style={styles.passwordGuide}>
              비밀번호는 8자 이상 72자 이하로 설정해 주세요.
            </Text>
          </View>

          <View style={styles.noticeCard}>
            <View style={styles.noticeRow}>
              <Text style={styles.warningIcon}>ⓘ</Text>
              <View style={styles.noticeText}>
                <Text style={styles.noticeTitle}>
                  회원 계정이 없기 때문에 비밀번호 찾기는 제공되지 않아요.
                </Text>
                <Text style={styles.noticeDescription}>
                  사건번호와 비밀번호를 안전한 곳에 보관해 주세요.
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.noticeRow}>
              <Text style={styles.clockIcon}>◷</Text>
              <Text style={styles.retentionText}>
                사건 기록은 30일 동안 보관됩니다. 보관 기간이 지나기 전에
                필요한 서류와 정보를 별도로 저장해 주세요.
              </Text>
            </View>
          </View>

          {errorMessage ? (
            <View accessibilityRole="alert" style={styles.errorNotice}>
              <Text style={styles.errorTitle}>처리하지 못했습니다</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
          ) : null}

          {isComplete ? (
            <View
              accessibilityLiveRegion="polite"
              style={styles.successNotice}
            >
              <Text style={styles.successTitle}>
                비밀번호가 안전하게 설정되었습니다.
              </Text>
              <Text style={styles.successDescription}>
                행동 가이드 화면이 준비되면 이 사건번호로 이어서 진행할 수
                있습니다.
              </Text>
            </View>
          ) : null}
        </View>
      </AppScreen>
    </>
  );
}

type PasswordInputProps = {
  label: string;
  value: string;
  placeholder: string;
  isVisible: boolean;
  editable: boolean;
  errorMessage: string | null;
  onChangeText: (value: string) => void;
  onVisibilityToggle: () => void;
};

function PasswordInput({
  label,
  value,
  placeholder,
  isVisible,
  editable,
  errorMessage,
  onChangeText,
  onVisibilityToggle,
}: PasswordInputProps) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View
        style={[
          styles.inputWrapper,
          errorMessage ? styles.inputWrapperError : undefined,
        ]}
      >
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          autoComplete="new-password"
          autoCorrect={false}
          editable={editable}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={!isVisible}
          style={styles.input}
          textContentType="newPassword"
          value={value}
        />
        <Pressable
          accessibilityLabel={
            isVisible ? `${label} 숨기기` : `${label} 보기`
          }
          accessibilityRole="button"
          disabled={!editable}
          hitSlop={10}
          onPress={onVisibilityToggle}
          style={({ pressed }) => [
            styles.visibilityButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.eye}>
            <View style={styles.eyePupil} />
            {isVisible ? null : <View style={styles.eyeSlash} />}
          </View>
        </Pressable>
      </View>
      {errorMessage ? (
        <Text accessibilityRole="alert" style={styles.fieldError}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
    paddingTop: spacing.sm,
  },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  checkCircle: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
  },
  checkIcon: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 16,
    color: colors.primary,
    fontSize: 21,
    fontWeight: "900",
    lineHeight: 27,
    textAlign: "center",
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center",
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },
  caseNumberCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  caseNumberText: {
    flex: 1,
    gap: spacing.xs,
  },
  caseNumberLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  caseNumber: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 1,
  },
  copyButton: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  copyIcon: {
    color: colors.background,
    fontSize: 13,
  },
  copyButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: "800",
  },
  passwordSection: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  inputWrapper: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  inputWrapperError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    minHeight: 52,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
  visibilityButton: {
    width: 48,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  eye: {
    width: 20,
    height: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.textSecondary,
    borderRadius: 10,
  },
  eyePupil: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
  },
  eyeSlash: {
    position: "absolute",
    width: 24,
    height: 2,
    backgroundColor: colors.textSecondary,
    transform: [{ rotate: "-35deg" }],
  },
  passwordGuide: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  fieldError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
  },
  noticeCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  noticeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  warningIcon: {
    color: colors.error,
    fontSize: 20,
    fontWeight: "800",
  },
  clockIcon: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: "800",
  },
  noticeText: {
    flex: 1,
    gap: spacing.sm,
  },
  noticeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 21,
  },
  noticeDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  retentionText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 19,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  errorNotice: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
  },
  errorTitle: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "800",
  },
  errorMessage: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 21,
  },
  successNotice: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  successTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  successDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
