import { useRouter, type Href } from "expo-router";
import { useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import {
  CaseApiError,
  createConfirmedCase,
} from "@/features/case/services/apiCaseFlow";
import { buildConfirmedCaseInput } from "@/features/case/utils/applyCaseAnswer";
import { colors, spacing } from "@/theme/tokens";

export function PasswordScreen() {
  const router = useRouter();
  const { draft, resetDraft } = useCaseDraft();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    try {
      const response = await createConfirmedCase(
        buildConfirmedCaseInput(draft, password),
      );
      const caseId = response.data.caseId;
      const caseNumber = response.data.case.caseNumber;

      router.replace({
        pathname: "/case/complete",
        params: { caseId, caseNumber },
      } as Href);
      resetDraft();
      setPassword("");
      setPasswordConfirmation("");
    } catch (error) {
      setErrorMessage(
        error instanceof CaseApiError
          ? error.message
          : "사건을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <FlowHeader step="7/7" title="비밀번호 설정" />
      <AppScreen
        footer={
          <Button
            title="사건 저장하기"
            onPress={() => void handleSubmit()}
            loading={isSubmitting}
            disabled={isSubmitting}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>사건 조회용 비밀번호를 설정해 주세요.</Text>
          <Text style={styles.description}>
            비밀번호는 저장 후 다시 확인할 수 없으니 안전하게 기억해 주세요.
          </Text>
          <AppTextInput
            label="비밀번호"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
          />
          <AppTextInput
            label="비밀번호 확인"
            value={passwordConfirmation}
            onChangeText={setPasswordConfirmation}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
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
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 23 },
});
