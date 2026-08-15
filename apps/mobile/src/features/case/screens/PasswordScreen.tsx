import { useRouter, type Href } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { LastCharacterPasswordInput } from "@/components/forms/LastCharacterPasswordInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import {
  CaseApiError,
  createConfirmedCase,
} from "@/features/case/services/apiCaseFlow";
import {
  authenticateSavedCase,
  saveCaseIfNeeded,
  type SavedCase,
} from "@/features/case/services/caseSaveAuthentication";
import { previousCaseService } from "@/features/case-access/services/previousCase";
import { buildConfirmedCaseInput } from "@/features/case/utils/applyCaseAnswer";
import { colors, radius, spacing } from "@/theme/tokens";

export function PasswordScreen() {
  const router = useRouter();
  const { setActiveCase } = useActiveCase();
  const { draft, resetDraft } = useCaseDraft();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedCase, setSavedCase] = useState<SavedCase | null>(null);
  const submissionInFlight = useRef(false);

  async function handleSubmit() {
    if (submissionInFlight.current) {
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setErrorMessage("비밀번호는 8자 이상 72자 이하로 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirmation) {
      setErrorMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);

    let caseToAuthenticate = savedCase;

    if (!caseToAuthenticate) {
      try {
        caseToAuthenticate = await saveCaseIfNeeded(null, () =>
          createConfirmedCase(buildConfirmedCaseInput(draft, password)),
        );
        setSavedCase(caseToAuthenticate);
      } catch (error) {
        setErrorMessage(
          error instanceof CaseApiError
            ? error.message
            : "사건을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
        submissionInFlight.current = false;
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const authenticatedCase = await authenticateSavedCase(
        caseToAuthenticate,
        password,
        previousCaseService.lookup,
      );

      setActiveCase({
        caseId: caseToAuthenticate.caseId,
        caseNumber: caseToAuthenticate.caseNumber,
        source: "NEW",
        accessToken: authenticatedCase.accessToken,
      });
      router.replace({
        pathname: "/case/complete",
        params: caseToAuthenticate,
      } as unknown as Href);
      resetDraft();
      setSavedCase(null);
      setPassword("");
      setPasswordConfirmation("");
    } catch {
      setErrorMessage(
        "사건은 저장됐지만 인증 또는 사건 카드 연결에 실패했습니다. 비밀번호를 확인한 뒤 다시 시도해 주세요.",
      );
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <FlowHeader title="비밀번호 설정" />
      <AppScreen
        footer={
          <Button
            title={savedCase ? "인증 다시 시도하기" : "사건 저장하기"}
            onPress={() => void handleSubmit()}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>사건 조회용 비밀번호를 설정해 주세요.</Text>
          <View accessibilityRole="alert" style={styles.warningCard}>
            <Text style={styles.warningTitle}>
              사건번호와 비밀번호는 다시 찾을 수 없습니다.
            </Text>
            <Text style={styles.warningDescription}>
              비로그인 방식이므로 별도의 찾기 기능을 제공하지 않습니다. 저장
              완료 후 발급되는 사건번호를 복사하고, 설정한 비밀번호와 함께
              안전한 곳에 보관해 주세요.
            </Text>
          </View>
          <LastCharacterPasswordInput
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            onToggleVisibility={() => setIsPasswordVisible((visible) => !visible)}
            placeholder="비밀번호 입력"
            visible={isPasswordVisible}
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <LastCharacterPasswordInput
            label="비밀번호 확인"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            onToggleVisibility={() => setIsPasswordConfirmationVisible((visible) => !visible)}
            placeholder="비밀번호 다시 입력"
            visible={isPasswordConfirmationVisible}
            autoComplete="new-password"
            textContentType="newPassword"
            error={errorMessage ?? undefined}
          />
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 32 },
  warningCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
  },
  warningTitle: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 22,
  },
  warningDescription: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
});
