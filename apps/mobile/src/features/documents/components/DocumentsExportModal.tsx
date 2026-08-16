import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import type { DocumentsExportRequest } from "@/features/documents/views/DocumentsView.types";
import { colors, radius, spacing } from "@/theme/tokens";

type ExportStep = "METHOD" | "EMAIL" | "GALLERY";

type DocumentsExportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (request: DocumentsExportRequest) => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function DocumentsExportModal({
  visible,
  onClose,
  onSubmit,
}: DocumentsExportModalProps) {
  const [step, setStep] = useState<ExportStep>("METHOD");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setStep("METHOD");
      setEmail("");
      setEmailError(null);
    }
  }, [visible]);

  function close() {
    onClose();
  }

  function goBack() {
    setEmailError(null);
    setStep("METHOD");
  }

  function submitEmail() {
    const normalizedEmail = email.trim();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setEmailError("올바른 이메일 주소를 입력해 주세요.");
      return;
    }

    onSubmit({ method: "EMAIL", email: normalizedEmail });
    close();
  }

  function submitGallery() {
    onSubmit({ method: "GALLERY" });
    close();
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={close}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <Pressable
          accessibilityLabel="내보내기 창 닫기"
          accessibilityRole="button"
          onPress={close}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.headingRow}>
            {step === "METHOD" ? (
              <View style={styles.headingSpacer} />
            ) : (
              <Pressable
                accessibilityLabel="전송 방식 선택으로 돌아가기"
                accessibilityRole="button"
                hitSlop={10}
                onPress={goBack}
                style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
              >
                <Ionicons color={colors.text} name="arrow-back" size={22} />
              </Pressable>
            )}

            <Text accessibilityRole="header" style={styles.title}>
              {step === "METHOD" ? "서류 내보내기" : step === "EMAIL" ? "이메일로 보내기" : "갤러리에 저장하기"}
            </Text>

            <Pressable
              accessibilityLabel="내보내기 창 닫기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={close}
              style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            >
              <Ionicons color={colors.textSecondary} name="close" size={24} />
            </Pressable>
          </View>

          {step === "METHOD" ? (
            <MethodStep onSelect={setStep} />
          ) : step === "EMAIL" ? (
            <View style={styles.stepContent}>
              <Text style={styles.description}>
                작성된 서류, 증빙자료, 가이드를 받을 이메일 주소를 입력해 주세요.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>이메일 주소</Text>
                <TextInput
                  accessibilityLabel="이메일 주소"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  autoFocus
                  keyboardType="email-address"
                  onChangeText={(value) => {
                    setEmail(value);
                    if (emailError) setEmailError(null);
                  }}
                  onSubmitEditing={submitEmail}
                  placeholder="example@email.com"
                  placeholderTextColor={colors.disabled}
                  returnKeyType="send"
                  style={[styles.input, emailError && styles.inputError]}
                  value={email}
                />
                {emailError ? (
                  <Text accessibilityRole="alert" style={styles.errorText}>
                    {emailError}
                  </Text>
                ) : null}
              </View>

              <PrimaryButton icon="mail-outline" label="이메일로 보내기" onPress={submitEmail} />
            </View>
          ) : (
            <View style={styles.stepContent}>
              <View style={styles.galleryPreview}>
                <View style={styles.galleryIcon}>
                  <Ionicons color={colors.primary} name="folder-open-outline" size={32} />
                </View>
                <View style={styles.galleryCopy}>
                  <Text style={styles.galleryTitle}>Travel Guard 서류</Text>
                  <Text style={styles.galleryDescription}>
                    갤러리에 전용 폴더를 만들고 모든 자료를 한 번에 저장합니다.
                  </Text>
                </View>
              </View>

              <Text style={styles.permissionNote}>
                저장할 때 사진 및 미디어 접근 권한을 요청할 수 있어요.
              </Text>

              <PrimaryButton icon="download-outline" label="갤러리에 저장하기" onPress={submitGallery} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function MethodStep({ onSelect }: { onSelect: (step: ExportStep) => void }) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.description}>
        작성된 서류, 증빙자료, 가이드를 어떤 방법으로 내보낼까요?
      </Text>

      <View style={styles.methodList}>
        <MethodButton
          description="입력한 이메일 주소로 모든 자료 보내기"
          icon="mail-outline"
          label="이메일로 보내기"
          onPress={() => onSelect("EMAIL")}
        />
        <MethodButton
          description="휴대폰 갤러리에 전용 폴더로 저장하기"
          icon="images-outline"
          label="갤러리에 저장하기"
          onPress={() => onSelect("GALLERY")}
        />
      </View>
    </View>
  );
}

function MethodButton({
  description,
  icon,
  label,
  onPress,
}: {
  description: string;
  icon: "mail-outline" | "images-outline";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityHint={description}
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.methodButton, pressed && styles.methodPressed]}
    >
      <View style={styles.methodIcon}>
        <Ionicons color={colors.primary} name={icon} size={26} />
      </View>
      <View style={styles.methodCopy}>
        <Text style={styles.methodLabel}>{label}</Text>
        <Text style={styles.methodDescription}>{description}</Text>
      </View>
      <Ionicons color={colors.textSecondary} name="chevron-forward" size={22} />
    </Pressable>
  );
}

function PrimaryButton({
  icon,
  label,
  onPress,
}: {
  icon: "mail-outline" | "download-outline";
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}
    >
      <Ionicons color={colors.background} name={icon} size={21} />
      <Text style={styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
  },
  sheet: {
    width: "100%",
    maxWidth: 440,
    overflow: "hidden",
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  headingRow: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headingSpacer: { width: 40 },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.6 },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  stepContent: {
    gap: spacing.md,
    padding: spacing.lg,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  methodList: { gap: spacing.sm },
  methodButton: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  methodPressed: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  methodIcon: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
  },
  methodCopy: { flex: 1, gap: spacing.xs },
  methodLabel: { color: colors.text, fontSize: 16, fontWeight: "800" },
  methodDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  fieldGroup: { gap: spacing.sm },
  label: { color: colors.text, fontSize: 14, fontWeight: "700" },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    fontSize: 16,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 12 },
  primaryButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  primaryPressed: { backgroundColor: colors.primaryPressed },
  primaryButtonText: { color: colors.background, fontSize: 16, fontWeight: "800" },
  galleryPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  galleryIcon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  galleryCopy: { flex: 1, gap: spacing.xs },
  galleryTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  galleryDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  permissionNote: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
});
