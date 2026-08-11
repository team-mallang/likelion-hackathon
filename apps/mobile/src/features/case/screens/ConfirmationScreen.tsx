import { useRouter, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { CaseInputItem, CaseType } from "@project/shared";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { colors, radius, spacing } from "@/theme/tokens";

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

function getItemKind(item: CaseInputItem) {
  const value = `${item.name} ${item.category ?? ""}`.toLowerCase();
  if (/card|카드/.test(value)) return "CARD";
  if (/phone|smartphone|휴대폰|핸드폰|스마트폰/.test(value)) return "PHONE";
  if (/wallet|bag|지갑|가방/.test(value)) return "WALLET_BAG";
  if (/passport|여권/.test(value)) return "PASSPORT";
  if (/cash|money|현금/.test(value)) return "CASH";
  return "OTHER";
}

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
      <FlowHeader title="사건 내용 확인" />
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
              label="사건 발생 추정 시간 (ISO 8601)"
              value={draft.estimatedOccurredAt ?? ""}
              onChangeText={(estimatedOccurredAt) =>
                updateDraft({ estimatedOccurredAt: estimatedOccurredAt || null })
              }
            />
            <AppTextInput
              label="사건 발생 추정 장소"
              value={draft.estimatedOccurredPlace ?? ""}
              onChangeText={(estimatedOccurredPlace) =>
                updateDraft({ estimatedOccurredPlace: estimatedOccurredPlace || null })
              }
            />
            <AppTextInput
              label="마지막 확인 이후 이동 경로"
              value={draft.routeAfterLastSeen ?? ""}
              multiline
              onChangeText={(routeAfterLastSeen) =>
                updateDraft({ routeAfterLastSeen: routeAfterLastSeen || null })
              }
            />
            <AppTextInput
              label="사건 당시 보관 상태"
              value={draft.storageState ?? ""}
              multiline
              onChangeText={(storageState) =>
                updateDraft({ storageState: storageState || null })
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
                label="색상"
                value={item.color ?? ""}
                onChangeText={(color) => updateItem(index, { color: color || null })}
              />
              <AppTextInput
                label="브랜드·제조사·카드사"
                value={item.brand ?? ""}
                onChangeText={(brand) => updateItem(index, { brand: brand || null })}
              />
              <AppTextInput
                label="모델명"
                value={item.model ?? ""}
                onChangeText={(model) => updateItem(index, { model: model || null })}
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
              {getItemKind(item) === "CARD" ? (
                <BooleanChoice
                  label="미승인 결제 내역"
                  value={item.unauthorizedTransactionOccurred ?? null}
                  onChange={(unauthorizedTransactionOccurred) =>
                    updateItem(index, { unauthorizedTransactionOccurred })
                  }
                />
              ) : null}
              {getItemKind(item) === "PHONE" ? (
                <>
                  <AppTextInput
                    label="휴대폰 케이스 특징"
                    value={item.phoneCaseDescription ?? ""}
                    onChangeText={(phoneCaseDescription) =>
                      updateItem(index, { phoneCaseDescription: phoneCaseDescription || null })
                    }
                  />
                  <BooleanChoice
                    label="기기 찾기 기능 사용 가능"
                    value={item.findMyDeviceAvailable ?? null}
                    onChange={(findMyDeviceAvailable) =>
                      updateItem(index, { findMyDeviceAvailable })
                    }
                  />
                </>
              ) : null}
              {getItemKind(item) === "WALLET_BAG" ? (
                <>
                  <AppTextInput
                    label="형태"
                    value={item.shape ?? ""}
                    onChangeText={(shape) => updateItem(index, { shape: shape || null })}
                  />
                  <AppTextInput
                    label="내부 주요 물품"
                    value={item.contentsDescription ?? ""}
                    multiline
                    onChangeText={(contentsDescription) =>
                      updateItem(index, { contentsDescription: contentsDescription || null })
                    }
                  />
                </>
              ) : null}
              {getItemKind(item) === "PASSPORT" ? (
                <>
                  <AppTextInput
                    label="여권 원본·사본 구분"
                    value={item.passportDocumentType ?? ""}
                    onChangeText={(passportDocumentType) =>
                      updateItem(index, {
                        passportDocumentType:
                          passportDocumentType === "ORIGINAL" ||
                          passportDocumentType === "COPY" ||
                          passportDocumentType === "BOTH" ||
                          passportDocumentType === "UNKNOWN"
                            ? passportDocumentType
                            : null,
                      })
                    }
                  />
                  <BooleanChoice
                    label="여권번호 인지 여부"
                    value={item.passportNumberKnown ?? null}
                    onChange={(passportNumberKnown) =>
                      updateItem(index, { passportNumberKnown })
                    }
                  />
                  <AppTextInput
                    label="출국 예정일 (ISO 8601)"
                    value={item.departureAt ?? ""}
                    onChangeText={(departureAt) =>
                      updateItem(index, { departureAt: departureAt || null })
                    }
                  />
                </>
              ) : null}
              {getItemKind(item) === "CASH" ? (
                <>
                  <AppTextInput
                    label="대략적인 현금 금액"
                    value={item.cashAmount === null || item.cashAmount === undefined ? "" : String(item.cashAmount)}
                    keyboardType="numeric"
                    onChangeText={(cashAmount) =>
                      updateItem(index, {
                        cashAmount: cashAmount ? Math.max(0, Number(cashAmount)) : null,
                      })
                    }
                  />
                  <AppTextInput
                    label="통화 코드"
                    value={item.currency ?? ""}
                    autoCapitalize="characters"
                    maxLength={3}
                    onChangeText={(currency) =>
                      updateItem(index, { currency: currency ? currency.toUpperCase() : null })
                    }
                  />
                </>
              ) : null}
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

function BooleanChoice({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.booleanField}>
      <Text style={styles.booleanLabel}>{label}</Text>
      <View style={styles.typeRow}>
        {[
          { label: "예", value: true },
          { label: "아니요", value: false },
        ].map((option) => (
          <Pressable
            key={option.label}
            onPress={() => onChange(option.value)}
            style={[styles.typeButton, value === option.value && styles.selectedType]}
          >
            <Text style={styles.typeText}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
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
  booleanField: { gap: spacing.sm },
  booleanLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },
});
