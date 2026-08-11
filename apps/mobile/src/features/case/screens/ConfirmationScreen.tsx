import { useRouter, type Href } from "expo-router";
import { useState } from "react";

import type { CaseInputItem } from "@project/shared";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { ConfirmationView } from "@/features/case/views/ConfirmationView";

const labels = { LOST: "분실", STOLEN: "도난", UNKNOWN: "미확정" } as const;

export function ConfirmationScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useCaseDraft();
  const [isEditing, setIsEditing] = useState(false);
  const updateItem = (id: string, changes: Partial<CaseInputItem>) => updateDraft({ items: draft.items.map((item, index) => String(index) === id ? { ...item, ...changes } : item) });
  const setNullable = (key: "lastSeenAt" | "lastSeenPlace" | "discoveredAt" | "discoveredPlace" | "estimatedOccurredAt" | "estimatedOccurredPlace" | "routeAfterLastSeen" | "storageState" | "description", value: string) => updateDraft({ [key]: value || null });
  const emergency = draft.items.some((item) => /passport|card|phone|여권|카드|휴대/.test(`${item.name} ${item.category ?? ""}`.toLowerCase()));
  const extra = [
    ["최초 진술", draft.initialStatement, (value: string) => updateDraft({ initialStatement: value })],
    ["국가 코드", draft.countryCode, (value: string) => updateDraft({ countryCode: value.toUpperCase() })],
    ["마지막 확인 시간", draft.lastSeenAt ?? "", (value: string) => setNullable("lastSeenAt", value)],
    ["분실/도난 인지 시간", draft.discoveredAt ?? "", (value: string) => setNullable("discoveredAt", value)],
    ["분실/도난 인지 장소", draft.discoveredPlace ?? "", (value: string) => setNullable("discoveredPlace", value)],
    ["발생 추정 시간", draft.estimatedOccurredAt ?? "", (value: string) => setNullable("estimatedOccurredAt", value)],
    ["발생 추정 장소", draft.estimatedOccurredPlace ?? "", (value: string) => setNullable("estimatedOccurredPlace", value)],
    ["마지막 확인 이후 이동경로", draft.routeAfterLastSeen ?? "", (value: string) => setNullable("routeAfterLastSeen", value)],
    ["보관 상태", draft.storageState ?? "", (value: string) => setNullable("storageState", value)],
  ].map(([label, value, onChange]) => ({ label: label as string, value: value as string, onChange: onChange as (value: string) => void }));

  return <ConfirmationView
    caseType={draft.type} caseTypeLabel={labels[draft.type]}
    items={draft.items.map((item, index) => ({ ...item, id: String(index) }))}
    occurredAtText={draft.lastSeenAt ?? ""} locationText={draft.lastSeenPlace ?? ""}
    emergencyItemIncluded={emergency} riskLevelLabel={draft.riskLevel}
    details={draft.description ?? ""} clues={draft.routeAfterLastSeen ?? ""}
    isEditing={isEditing} isSaving={false} isSaved={false} canConfirm={true}
    errorMessage={draft.errorMessage}
    onBack={() => router.back()} onCaseTypeChange={(type) => updateDraft({ type })}
    onDetailsChange={(value) => setNullable("description", value)} onCluesChange={(value) => setNullable("routeAfterLastSeen", value)}
    onEditToggle={() => setIsEditing((value) => !value)} onConfirm={() => router.push("/case/password" as Href)}
    onItemAdd={() => updateDraft({ items: [...draft.items, { name: "", quantity: 1 }] })}
    onItemChange={updateItem} onItemRemove={(id) => updateDraft({ items: draft.items.filter((_, index) => String(index) !== id) })}
    onLocationChange={(value) => setNullable("lastSeenPlace", value)} onOccurredAtChange={(value) => setNullable("lastSeenAt", value)}
    additionalCaseFields={extra}
  />;
}
