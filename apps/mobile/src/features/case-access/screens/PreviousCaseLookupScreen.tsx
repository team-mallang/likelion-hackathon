import { generatedCaseNumberSchema } from "@project/shared";
import { useRouter, type Href } from "expo-router";
import { Alert } from "react-native";
import { useMemo, useRef, useState } from "react";

import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import {
  PreviousCaseServiceError,
  previousCaseService,
} from "@/features/case-access/services/previousCase";
import { PreviousCaseLookupView } from "@/features/case-access/views/PreviousCaseLookupView";

function normalizeCaseNumber(value: string) {
  return value.trim().replaceAll("-", "").toUpperCase();
}

export function PreviousCaseLookupScreen() {
  const router = useRouter();
  const { setActiveCase } = useActiveCase();
  const { resetDraft } = useCaseDraft();
  const [caseNumber, setCaseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [caseNumberError, setCaseNumberError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);

  const normalizedCaseNumber = useMemo(
    () => normalizeCaseNumber(caseNumber),
    [caseNumber],
  );
  const isCaseNumberValid = generatedCaseNumberSchema.safeParse(
    normalizedCaseNumber,
  ).success;
  const isPasswordValid = password.length >= 8 && password.length <= 72;
  const canSubmit = isCaseNumberValid && isPasswordValid;

  function handleCaseNumberChange(value: string) {
    setCaseNumber(value);
    setCaseNumberError(null);
    setSubmissionError(null);
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setPasswordError(null);
    setSubmissionError(null);
  }

  async function handleSubmit() {
    if (submissionInFlight.current) {
      return;
    }

    const nextCaseNumberError = isCaseNumberValid
      ? null
      : "사건번호 형식을 확인해 주세요.";
    const nextPasswordError = isPasswordValid
      ? null
      : "비밀번호는 8자 이상 72자 이하로 입력해 주세요.";

    setCaseNumberError(nextCaseNumberError);
    setPasswordError(nextPasswordError);

    if (nextCaseNumberError || nextPasswordError) {
      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const result = await previousCaseService.lookup({
        caseNumber: normalizedCaseNumber,
        password,
      });

      setActiveCase({
        caseId: result.caseId,
        caseNumber: result.caseNumber,
        source: "RESTORED",
        accessToken: result.accessToken,
      });
      setPassword("");
      router.replace("/case/card" as Href);
    } catch (error) {
      setSubmissionError(
        error instanceof PreviousCaseServiceError
          ? error.message
          : "이전 사건을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  function handleStartNewCase() {
    resetDraft();
    router.push("/case/new" as Href);
  }

  function handleUnavailableTab() {
    Alert.alert("준비 중", "해당 화면은 준비 중입니다.");
  }

  return (
    <PreviousCaseLookupView
      canSubmit={canSubmit}
      caseNumber={caseNumber}
      caseNumberError={caseNumberError}
      isPasswordVisible={isPasswordVisible}
      isSubmitting={isSubmitting}
      onBack={() => router.back()}
      onCaseTab={handleUnavailableTab}
      onChangeCaseNumber={handleCaseNumberChange}
      onChangePassword={handlePasswordChange}
      onDocumentsTab={handleUnavailableTab}
      onGuideTab={handleUnavailableTab}
      onStartNewCase={handleStartNewCase}
      onSubmit={() => void handleSubmit()}
      onTogglePasswordVisibility={() =>
        setIsPasswordVisible((visible) => !visible)
      }
      password={password}
      passwordError={passwordError}
      submissionError={submissionError}
    />
  );
}
