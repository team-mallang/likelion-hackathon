import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { CaseFlowError } from "@/features/case/services/caseFlow";
import { mockCaseFlow } from "@/features/case/services/mockCaseFlow";
import type { CaseDraftItem } from "@/features/case/types/caseDraft";
import { ConfirmationView } from "@/features/case/views/ConfirmationView";

let localItemSequence = 0;

function createLocalItemId() {
  localItemSequence += 1;
  return `case-item-${Date.now()}-${localItemSequence}`;
}

function getCaseTypeLabel(caseType: "LOST" | "STOLEN" | "UNKNOWN") {
  if (caseType === "LOST") {
    return "분실 신고";
  }

  if (caseType === "STOLEN") {
    return "도난 신고";
  }

  return "유형 미확정";
}

function getRiskLevelLabel(riskLevel: "LOW" | "MEDIUM" | "HIGH") {
  if (riskLevel === "HIGH") {
    return "높음";
  }

  if (riskLevel === "MEDIUM") {
    return "보통";
  }

  return "낮음";
}

function getValidationError(
  caseType: "LOST" | "STOLEN" | "UNKNOWN",
  items: CaseDraftItem[],
  occurredAtText: string,
  locationText: string,
) {
  if (caseType === "UNKNOWN") {
    return "사건 유형을 선택해 주세요.";
  }

  if (items.length === 0) {
    return "분실하거나 도난당한 물품을 한 개 이상 추가해 주세요.";
  }

  if (items.some((item) => !item.name.trim())) {
    return "모든 물품의 이름을 입력해 주세요.";
  }

  if (!occurredAtText.trim()) {
    return "사건 발생 시간을 입력해 주세요.";
  }

  if (!locationText.trim()) {
    return "사건 발생 장소를 입력해 주세요.";
  }

  return null;
}

export function ConfirmationScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useCaseDraft();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const saveRequestIdRef = useRef(0);
  const saveInFlightRef = useRef(false);

  const validationError = getValidationError(
    draft.caseType,
    draft.items,
    draft.occurredAtText,
    draft.locationText,
  );
  const canConfirm = validationError === null && !isSaving;

  useEffect(() => {
    return () => {
      saveRequestIdRef.current += 1;
      saveInFlightRef.current = false;
    };
  }, []);

  function invalidateSavedState() {
    setIsSaved(false);
    setErrorMessage(null);
  }

  function handleBack() {
    if (saveInFlightRef.current) {
      saveRequestIdRef.current += 1;
      saveInFlightRef.current = false;
      setIsSaving(false);
    }

    router.back();
  }

  function handleEditToggle() {
    if (saveInFlightRef.current) {
      return;
    }

    setIsEditing((current) => !current);
    setErrorMessage(null);
  }

  function handleCaseTypeChange(
    value: "LOST" | "STOLEN" | "UNKNOWN",
  ) {
    if (saveInFlightRef.current) {
      return;
    }

    invalidateSavedState();
    updateDraft({ caseType: value });
  }

  function handleItemAdd() {
    if (saveInFlightRef.current) {
      return;
    }

    invalidateSavedState();
    updateDraft({
      items: [
        ...draft.items,
        {
          id: createLocalItemId(),
          name: "",
          category: "",
          description: "",
        },
      ],
    });
  }

  function handleItemChange(
    id: string,
    changes: Partial<CaseDraftItem>,
  ) {
    if (saveInFlightRef.current) {
      return;
    }

    invalidateSavedState();
    updateDraft({
      items: draft.items.map((item) =>
        item.id === id
          ? {
              ...item,
              ...changes,
              id: item.id,
            }
          : item,
      ),
    });
  }

  function handleItemRemove(id: string) {
    if (saveInFlightRef.current) {
      return;
    }

    invalidateSavedState();
    updateDraft({
      items: draft.items.filter((item) => item.id !== id),
    });
  }

  function handleOccurredAtChange(value: string) {
    if (saveInFlightRef.current) {
      return;
    }

    invalidateSavedState();
    updateDraft({ occurredAtText: value });
  }

  function handleLocationChange(value: string) {
    if (saveInFlightRef.current) {
      return;
    }

    invalidateSavedState();
    updateDraft({ locationText: value, coordinates: null });
  }

  function handleDetailsChange(value: string) {
    if (saveInFlightRef.current) {
      return;
    }

    invalidateSavedState();
    updateDraft({ details: value });
  }

  function handleCluesChange(value: string) {
    if (saveInFlightRef.current) {
      return;
    }

    invalidateSavedState();
    updateDraft({ clues: value });
  }

  async function handleConfirm() {
    if (saveInFlightRef.current || isSaving) {
      return;
    }

    if (validationError) {
      setIsEditing(true);
      setIsSaved(false);
      setErrorMessage(validationError);
      return;
    }

    saveInFlightRef.current = true;
    const requestId = ++saveRequestIdRef.current;
    setIsSaving(true);
    setIsSaved(false);
    setErrorMessage(null);

    try {
      await mockCaseFlow.saveDraft(draft);

      if (requestId !== saveRequestIdRef.current) {
        return;
      }

      setIsEditing(false);
      setIsSaved(true);
    } catch (error) {
      if (requestId !== saveRequestIdRef.current) {
        return;
      }

      setErrorMessage(
        error instanceof CaseFlowError
          ? error.message
          : "사건 초안을 저장하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      if (requestId === saveRequestIdRef.current) {
        saveInFlightRef.current = false;
        setIsSaving(false);
      }
    }
  }

  return (
    <ConfirmationView
      caseType={draft.caseType}
      caseTypeLabel={getCaseTypeLabel(draft.caseType)}
      items={draft.items}
      occurredAtText={draft.occurredAtText}
      locationText={draft.locationText}
      emergencyItemIncluded={draft.emergencyItemIncluded}
      riskLevelLabel={getRiskLevelLabel(draft.riskLevel)}
      details={draft.details}
      clues={draft.clues}
      isEditing={isEditing}
      isSaving={isSaving}
      isSaved={isSaved}
      canConfirm={canConfirm}
      errorMessage={errorMessage}
      onBack={handleBack}
      onCaseTypeChange={handleCaseTypeChange}
      onCluesChange={handleCluesChange}
      onConfirm={handleConfirm}
      onDetailsChange={handleDetailsChange}
      onEditToggle={handleEditToggle}
      onItemAdd={handleItemAdd}
      onItemChange={handleItemChange}
      onItemRemove={handleItemRemove}
      onLocationChange={handleLocationChange}
      onOccurredAtChange={handleOccurredAtChange}
    />
  );
}
