import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CaseInputItem, CaseType } from "@project/shared";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
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

const caseTypes: Array<{ value: CaseType; label: string }> = [
  { value: "LOST", label: "분실" },
  { value: "STOLEN", label: "도난" },
  { value: "UNKNOWN", label: "알 수 없음" },
];

const emergencyItemKeywords = [
  "passport",
  "여권",
  "card",
  "카드",
  "phone",
  "휴대폰",
  "medication",
  "약",
];

export function ConfirmationScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useCaseDraft();
  const emergencyItemIncluded = draft.items.some((item) => {
    const itemText = `${item.name} ${item.category ?? ""}`.toLowerCase();
    return emergencyItemKeywords.some((keyword) => itemText.includes(keyword));
  });

  function updateItem(index: number, changes: Partial<CaseInputItem>) {
    updateDraft({
      items: draft.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...changes } : item,
      ),
    });
  }

  function addItem() {
    updateDraft({
      items: [...draft.items, { name: "", quantity: 1 }],
    });
  }

  function removeItem(index: number) {
    updateDraft({
      items: draft.items.filter((_, itemIndex) => itemIndex !== index),
    });
  }

  return (
    <>
      <FlowHeader step="6/7" title="사건 내용 확인" />
      <AppScreen
        footer={
          <Button
            title="사건 내용 확정하기"
            onPress={() => router.push("/case/password" as Href)}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>저장 전에 사건 내용을 확인해 주세요.</Text>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>사건 유형</Text>
            <View style={styles.typeRow}>
              {caseTypes.map((caseType) => (
                <Pressable
                  key={caseType.value}
                  onPress={() => updateDraft({ type: caseType.value })}
                  style={[
                    styles.typeButton,
                    draft.type === caseType.value && styles.selectedType,
                  ]}
                >
                  <Text style={styles.typeText}>{caseType.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>사건 정보</Text>
            <AppTextInput
              label="최초 진술"
              value={draft.initialStatement}
              multiline
              onChangeText={(initialStatement) => updateDraft({ initialStatement })}
            />
            <AppTextInput
              label="국가 코드"
              value={draft.countryCode}
              autoCapitalize="characters"
              maxLength={2}
              onChangeText={(countryCode) =>
                updateDraft({ countryCode: countryCode.toUpperCase() })
              }
            />
            <AppTextInput
              label="마지막 확인 시간 (ISO 8601)"
              value={draft.lastSeenAt ?? ""}
              onChangeText={(lastSeenAt) => updateDraft({ lastSeenAt: lastSeenAt || null })}
            />
            <AppTextInput
              label="마지막 확인 장소"
              value={draft.lastSeenPlace ?? ""}
              onChangeText={(lastSeenPlace) =>
                updateDraft({ lastSeenPlace: lastSeenPlace || null })
              }
            />
            <AppTextInput
              label="분실·도난 발견 시간 (ISO 8601)"
              value={draft.discoveredAt ?? ""}
              onChangeText={(discoveredAt) =>
                updateDraft({ discoveredAt: discoveredAt || null })
              }
            />
            <AppTextInput
              label="분실·도난 발견 장소"
              value={draft.discoveredPlace ?? ""}
              onChangeText={(discoveredPlace) =>
                updateDraft({ discoveredPlace: discoveredPlace || null })
              }
            />
            <AppTextInput
              label="상세 특징 및 추가 단서"
              value={draft.description ?? ""}
              multiline
              onChangeText={(description) =>
                updateDraft({ description: description || null })
              }
            />
          </View>

          {draft.items.map((item, index) => (
            <View key={`${index}-${item.name}`} style={styles.card}>
              <Text style={styles.sectionTitle}>물품 {index + 1}</Text>
              <AppTextInput
                label="물품명"
                value={item.name}
                onChangeText={(name) => updateItem(index, { name })}
              />
              <AppTextInput
                label="수량"
                value={String(item.quantity)}
                keyboardType="numeric"
                onChangeText={(quantity) =>
                  updateItem(index, {
                    quantity: Math.max(1, Number.parseInt(quantity, 10) || 1),
                  })
                }
              />
              <AppTextInput
                label="분류"
                value={item.category ?? ""}
                onChangeText={(category) =>
                  updateItem(index, { category: category || null })
                }
              />
              <AppTextInput
                label="설명"
                value={item.description ?? ""}
                multiline
                onChangeText={(description) =>
                  updateItem(index, { description: description || null })
                }
              />
              <AppTextInput
                label="식별 특징"
                value={item.identifyingFeature ?? ""}
                onChangeText={(identifyingFeature) =>
                  updateItem(index, {
                    identifyingFeature: identifyingFeature || null,
                  })
                }
              />
              <Button
                title="물품 삭제"
                variant="outline"
                onPress={() => removeItem(index)}
              />
            </View>
          ))}

          <Button title="물품 추가" variant="secondary" onPress={addItem} />

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>AI 요약</Text>
            <Text style={styles.value}>{draft.aiSummary ?? "요약 없음"}</Text>
            <Text style={styles.value}>
              긴급 물품: {emergencyItemIncluded ? "포함" : "미포함"}
            </Text>
            <Text style={styles.value}>위험도: {draft.riskLevel}</Text>
          </View>
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 32 },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  typeRow: { flexDirection: "row", gap: spacing.sm },
  typeButton: {
    flex: 1,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  selectedType: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  typeText: { color: colors.text, fontWeight: "600" },
  value: { color: colors.text, fontSize: 15, lineHeight: 23 },
});
