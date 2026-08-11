import { casePasswordSchema } from "@project/shared";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { CaseFlowError } from "@/features/case/services/caseFlow";
import { mockCaseFlow } from "@/features/case/services/mockCaseFlow";
import { CaseAccessView } from "@/features/case/views/CaseAccessView";

function formatCaseNumber(caseNumber: string) {
  const match = /^([A-Z]{2})(\d{4})([A-Z0-9]{4})$/.exec(caseNumber);

  if (!match) {
    return caseNumber;
  }

  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function CaseAccessScreen() {
  const router = useRouter();
  const { draft } = useCaseDraft();
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmationVisible, setIsPasswordConfirmationVisible] =
    useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<
    string | null
  >(null);
  const [passwordConfirmationErrorMessage, setPasswordConfirmationErrorMessage] =
    useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submitRequestIdRef = useRef(0);
  const submitInFlightRef = useRef(false);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayCaseNumber = formatCaseNumber(draft.caseNumber ?? "");
  const passwordResult = casePasswordSchema.safeParse(password);
  const canSubmit =
    Boolean(draft.caseId && draft.caseNumber) &&
    passwordResult.success &&
    password === passwordConfirmation &&
    !isSubmitting &&
    !isComplete;

  useEffect(() => {
    return () => {
      submitRequestIdRef.current += 1;
      submitInFlightRef.current = false;

      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }
    };
  }, []);

  function handleBack() {
    if (submitInFlightRef.current) {
      submitRequestIdRef.current += 1;
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }

    router.back();
  }

  async function handleCopyCaseNumber() {
    if (!displayCaseNumber) {
      setErrorMessage("복사할 사건번호가 없습니다.");
      return;
    }

    try {
      await Clipboard.setStringAsync(displayCaseNumber);
      setIsCopied(true);
      setErrorMessage(null);

      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
      }

      copyResetTimerRef.current = setTimeout(() => {
        setIsCopied(false);
        copyResetTimerRef.current = null;
      }, 2000);
    } catch {
      setIsCopied(false);
      setErrorMessage("사건번호를 복사하지 못했습니다. 직접 기록해 주세요.");
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setPasswordErrorMessage(null);
    setPasswordConfirmationErrorMessage(null);
    setErrorMessage(null);
  }

  function handlePasswordConfirmationChange(value: string) {
    setPasswordConfirmation(value);
    setPasswordConfirmationErrorMessage(null);
    setErrorMessage(null);
  }

  function validateInput() {
    if (!draft.caseId || !draft.caseNumber) {
      setErrorMessage(
        "저장된 사건정보를 찾을 수 없습니다. 이전 화면에서 다시 저장해 주세요.",
      );
      return false;
    }

    const result = casePasswordSchema.safeParse(password);

    if (!result.success) {
      setPasswordErrorMessage(
        result.error.issues[0]?.message ??
          "비밀번호 형식이 올바르지 않습니다.",
      );
      return false;
    }

    if (password !== passwordConfirmation) {
      setPasswordConfirmationErrorMessage(
        "입력한 비밀번호가 서로 일치하지 않습니다.",
      );
      return false;
    }

    setPasswordErrorMessage(null);
    setPasswordConfirmationErrorMessage(null);
    return true;
  }

  async function handleSubmit() {
    if (
      submitInFlightRef.current ||
      isSubmitting ||
      isComplete ||
      !validateInput() ||
      !draft.caseId
    ) {
      return;
    }

    submitInFlightRef.current = true;
    const requestId = ++submitRequestIdRef.current;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await mockCaseFlow.setCasePassword({
        caseId: draft.caseId,
        password,
      });

      if (requestId !== submitRequestIdRef.current) {
        return;
      }

      setPassword("");
      setPasswordConfirmation("");
      setIsPasswordVisible(false);
      setIsPasswordConfirmationVisible(false);
      setIsComplete(true);
    } catch (error) {
      if (requestId !== submitRequestIdRef.current) {
        return;
      }

      setErrorMessage(
        error instanceof CaseFlowError
          ? error.message
          : "비밀번호를 설정하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      if (requestId === submitRequestIdRef.current) {
        submitInFlightRef.current = false;
        setIsSubmitting(false);
      }
    }
  }

  return (
    <CaseAccessView
      caseNumber={displayCaseNumber}
      password={password}
      passwordConfirmation={passwordConfirmation}
      isPasswordVisible={isPasswordVisible}
      isPasswordConfirmationVisible={isPasswordConfirmationVisible}
      isCopied={isCopied}
      isSubmitting={isSubmitting}
      isComplete={isComplete}
      canSubmit={canSubmit}
      passwordErrorMessage={passwordErrorMessage}
      passwordConfirmationErrorMessage={passwordConfirmationErrorMessage}
      errorMessage={
        errorMessage ??
        (!draft.caseId || !draft.caseNumber
          ? "저장된 사건정보를 찾을 수 없습니다. 이전 화면에서 다시 저장해 주세요."
          : null)
      }
      onBack={handleBack}
      onCopyCaseNumber={handleCopyCaseNumber}
      onPasswordChange={handlePasswordChange}
      onPasswordConfirmationChange={handlePasswordConfirmationChange}
      onPasswordVisibilityToggle={() =>
        setIsPasswordVisible((current) => !current)
      }
      onPasswordConfirmationVisibilityToggle={() =>
        setIsPasswordConfirmationVisible((current) => !current)
      }
      onSubmit={handleSubmit}
    />
  );
}
