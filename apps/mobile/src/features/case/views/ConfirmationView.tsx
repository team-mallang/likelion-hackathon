import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { colors, radius, spacing } from "@/theme/tokens";

import type { ConfirmationViewProps } from "./ConfirmationView.types";

function itemKind(item: { name: string; category?: string | null }) {
  const value = `${item.name} ${item.category ?? ""}`.toLowerCase();
  if (/card|카드/.test(value)) return "card";
  if (/phone|휴대폰|스마트폰/.test(value)) return "phone";
  if (/wallet|bag|지갑|가방/.test(value)) return "walletBag";
  if (/passport|여권/.test(value)) return "passport";
  if (/cash|money|현금/.test(value)) return "cash";
  return "other";
}

const CASE_TYPE_OPTIONS = [
  { value: "LOST", label: "분실" },
  { value: "STOLEN", label: "도난" },
  { value: "UNKNOWN", label: "미확정" },
] as const;

export function ConfirmationView({
  caseType,
  caseTypeLabel,
  items,
  occurredAtText,
  locationText,
  emergencyItemIncluded,
  details,
  isEditing,
  isSaving,
  isSaved,
  canConfirm,
  errorMessage,
  onBack,
  onCaseTypeChange,
  onConfirm,
  onDetailsChange,
  onEditToggle,
  onItemAdd,
  onItemChange,
  onItemRemove,
  onLocationChange,
  onOccurredAtChange,
  additionalCaseFields = [],
}: ConfirmationViewProps) {
  const confirmButtonTitle = isSaved
    ? "저장 완료"
    : errorMessage && canConfirm
      ? "다시 저장하기"
      : canConfirm
        ? "사건 내용 확정하기"
        : "필수 정보 확인하기";

  return (
    <>
      <FlowHeader onBack={onBack} title="최종 확인" />
      <ProgressBar progress={1} />

      <AppScreen
        footer={
          <Button
            title={confirmButtonTitle}
            onPress={onConfirm}
            loading={isSaving}
            disabled={isSaving || isSaved}
          />
        }
      >
        <View style={styles.container}>
          <View style={styles.headingRow}>
            <View style={styles.headingText}>
              <Text style={styles.title}>사건 내용을 정리했습니다</Text>
              <Text style={styles.description}>
                저장하기 전에 분석된 내용을 확인하고 필요한 부분을 수정해
                주세요.
              </Text>
            </View>

            <View style={styles.editButton}>
              <Button
                title={isEditing ? "수정 완료" : "내용 수정"}
                onPress={onEditToggle}
                variant="outline"
                disabled={isSaving}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>사건 유형</Text>
            {isEditing ? (
              <View accessibilityRole="radiogroup" style={styles.typeOptions}>
                {CASE_TYPE_OPTIONS.map((option) => {
                  const isSelected = caseType === option.value;

                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: isSelected,
                        disabled: isSaving,
                      }}
                      disabled={isSaving}
                      key={option.value}
                      onPress={() => onCaseTypeChange(option.value)}
                      style={({ pressed }) => [
                        styles.typeOption,
                        isSelected && styles.typeOptionSelected,
                        pressed && !isSaving && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          isSelected && styles.typeOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.prominentValue}>{caseTypeLabel}</Text>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.sectionHeadingText}>
                <Text style={styles.sectionTitle}>관련 물품</Text>
                <Text style={styles.sectionDescription}>
                  물품 이름과 특징을 확인해 주세요.
                </Text>
              </View>

              {isEditing ? (
                <View style={styles.addButton}>
                  <Button
                    title="물품 추가"
                    onPress={onItemAdd}
                    variant="secondary"
                    disabled={isSaving}
                  />
                </View>
              ) : null}
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>등록된 물품이 없습니다.</Text>
            ) : (
              items.map((item, index) => (
                <View key={item.id} style={styles.itemCard}>
                  {isEditing ? (
                    <>
                      <AppTextInput
                        label={`물품 ${index + 1} 이름`}
                        editable={!isSaving}
                        onChangeText={(value) =>
                          onItemChange(item.id, { name: value })
                        }
                        placeholder="예: 검은색 가죽 지갑"
                        value={item.name}
                      />
                      <AppTextInput
                        label="분류"
                        editable={!isSaving}
                        onChangeText={(value) =>
                          onItemChange(item.id, { category: value })
                        }
                        placeholder="예: 지갑"
                        value={item.category ?? ""}
                      />
                      <AppTextInput label="수량" editable={!isSaving} keyboardType="numeric" onChangeText={(value) => onItemChange(item.id, { quantity: Math.max(1, Number.parseInt(value, 10) || 1) })} value={String(item.quantity)} />
                      <AppTextInput label="브랜드 / 제조사" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { brand: value || null })} value={item.brand ?? ""} />
                      <AppTextInput label="모델" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { model: value || null })} value={item.model ?? ""} />
                      <AppTextInput label="색상" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { color: value || null })} value={item.color ?? ""} />
                      <AppTextInput
                        label="물품 특징"
                        multiline
                        editable={!isSaving}
                        onChangeText={(value) =>
                          onItemChange(item.id, { description: value })
                        }
                        placeholder="색상, 브랜드, 식별 가능한 특징"
                        style={styles.shortMultilineInput}
                        textAlignVertical="top"
                        value={item.description ?? ""}
                      />
                      <AppTextInput label="식별 특징" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { identifyingFeature: value || null })} value={item.identifyingFeature ?? ""} />
                      {itemKind(item) === "card" ? <AppTextInput label="미승인 결제 여부 (true/false)" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { unauthorizedTransactionOccurred: value === "true" ? true : value === "false" ? false : null })} value={item.unauthorizedTransactionOccurred == null ? "" : String(item.unauthorizedTransactionOccurred)} /> : null}
                      {itemKind(item) === "phone" ? <><AppTextInput label="케이스 특징" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { phoneCaseDescription: value || null })} value={item.phoneCaseDescription ?? ""} /><AppTextInput label="기기 찾기 가능 (true/false)" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { findMyDeviceAvailable: value === "true" ? true : value === "false" ? false : null })} value={item.findMyDeviceAvailable == null ? "" : String(item.findMyDeviceAvailable)} /></> : null}
                      {itemKind(item) === "walletBag" ? <><AppTextInput label="형태" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { shape: value || null })} value={item.shape ?? ""} /><AppTextInput label="내용물" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { contentsDescription: value || null })} value={item.contentsDescription ?? ""} /></> : null}
                      {itemKind(item) === "passport" ? <><AppTextInput label="문서 유형" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { passportDocumentType: value === "ORIGINAL" || value === "COPY" || value === "BOTH" || value === "UNKNOWN" ? value : null })} value={item.passportDocumentType ?? ""} /><AppTextInput label="여권번호 인지 (true/false)" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { passportNumberKnown: value === "true" ? true : value === "false" ? false : null })} value={item.passportNumberKnown == null ? "" : String(item.passportNumberKnown)} /><AppTextInput label="출국 예정일" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { departureAt: value || null })} value={item.departureAt ?? ""} /></> : null}
                      {itemKind(item) === "cash" ? <><AppTextInput label="현금 금액" keyboardType="numeric" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { cashAmount: value ? Number(value) : null })} value={item.cashAmount == null ? "" : String(item.cashAmount)} /><AppTextInput label="통화" editable={!isSaving} onChangeText={(value) => onItemChange(item.id, { currency: value ? value.toUpperCase() : null })} value={item.currency ?? ""} /></> : null}
                      <Button
                        title="이 물품 삭제"
                        onPress={() => onItemRemove(item.id)}
                        variant="outline"
                        disabled={isSaving}
                      />
                    </>
                  ) : (
                    <>
                      <Text style={styles.itemName}>
                        {item.name || `물품 ${index + 1}`}
                      </Text>
                      {item.category ? (
                        <Text style={styles.metaText}>{item.category}</Text>
                      ) : null}
                      <Text style={styles.value}>{[item.brand, item.model, item.color, item.identifyingFeature].filter(Boolean).join(" · ") || "추가 물품 정보 없음"}</Text>
                      {itemKind(item) === "card" ? <Text style={styles.value}>미승인 결제: {item.unauthorizedTransactionOccurred == null ? "미확인" : item.unauthorizedTransactionOccurred ? "예" : "아니오"}</Text> : null}
                      {itemKind(item) === "phone" ? <Text style={styles.value}>케이스: {item.phoneCaseDescription || "미확인"} · 기기 찾기: {item.findMyDeviceAvailable == null ? "미확인" : item.findMyDeviceAvailable ? "가능" : "불가"}</Text> : null}
                      {itemKind(item) === "walletBag" ? <Text style={styles.value}>형태: {item.shape || "미확인"} · 내용물: {item.contentsDescription || "미확인"}</Text> : null}
                      {itemKind(item) === "passport" ? <Text style={styles.value}>문서: {item.passportDocumentType || "미확인"} · 번호 인지: {item.passportNumberKnown == null ? "미확인" : item.passportNumberKnown ? "예" : "아니오"} · 출국: {item.departureAt || "미확인"}</Text> : null}
                      {itemKind(item) === "cash" ? <Text style={styles.value}>금액: {item.cashAmount ?? "미확인"} {item.currency ?? ""}</Text> : null}
                      <Text style={styles.value}>
                        {item.description || "입력된 특징이 없습니다."}
                      </Text>
                    </>
                  )}
                </View>
              ))
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>발생 장소와 시간</Text>
            {isEditing ? (
              <>
                <AppTextInput
                  label="사건 발생 장소"
                  editable={!isSaving}
                  onChangeText={onLocationChange}
                  value={locationText}
                />
                <AppTextInput
                  label="사건 발생 시간"
                  editable={!isSaving}
                  onChangeText={onOccurredAtChange}
                  value={occurredAtText}
                />
              </>
            ) : (
              <View style={styles.summaryRows}>
                <SummaryRow label="장소" value={locationText} />
                <SummaryRow label="시간" value={occurredAtText} />
              </View>
            )}
          </View>

          {additionalCaseFields.length > 0 ? <View style={styles.card}>
            <Text style={styles.sectionTitle}>사건 상세 정보</Text>
            {additionalCaseFields.map((field) => isEditing ? <AppTextInput key={field.label} label={field.label} editable={!isSaving} multiline={field.label.includes("경로") || field.label.includes("상태") || field.label.includes("진술")} value={field.value} onChangeText={field.onChange} /> : <SummaryRow key={field.label} label={field.label} value={field.value} />)}
          </View> : null}

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>분석 결과</Text>
            <View style={styles.summaryRows}>
              <SummaryRow
                label="긴급 물품"
                value={emergencyItemIncluded ? "포함됨" : "포함되지 않음"}
              />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>주요 정황 및 추가 단서</Text>
            {isEditing ? (
              <AppTextInput
                label="주요 정황 및 추가 단서"
                multiline
                editable={!isSaving}
                onChangeText={onDetailsChange}
                placeholder="사건 전후의 주요 정황이나 추가 단서를 입력해 주세요."
                style={styles.multilineInput}
                textAlignVertical="top"
                value={details}
              />
            ) : (
              <Text style={styles.value}>
                {details || "입력된 주요 정황 및 추가 단서가 없습니다."}
              </Text>
            )}
          </View>


          {isSaving ? (
            <View
              accessibilityLiveRegion="polite"
              style={styles.savingNotice}
            >
              <Text style={styles.savingTitle}>사건 초안을 저장하고 있어요</Text>
              <Text style={styles.noticeDescription}>
                저장이 끝날 때까지 잠시만 기다려 주세요.
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View accessibilityRole="alert" style={styles.errorNotice}>
              <Text style={styles.errorTitle}>저장 내용을 확인해 주세요</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <Text style={styles.noticeDescription}>
                입력한 내용은 유지됩니다. 수정하거나 다시 저장할 수 있어요.
              </Text>
            </View>
          ) : null}

          {isSaved ? (
            <View
              accessibilityLiveRegion="polite"
              style={styles.successNotice}
            >
              <Text style={styles.successTitle}>
                사건 초안이 저장되었습니다.
              </Text>
              <Text style={styles.noticeDescription}>
                다음 단계는 사건번호와 비밀번호 설정입니다.
              </Text>
            </View>
          ) : null}
        </View>
      </AppScreen>
    </>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.summaryValue}>{value || "입력되지 않음"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  headingRow: {
    gap: spacing.md,
  },
  headingText: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  editButton: {
    alignSelf: "flex-start",
    minWidth: 120,
  },
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  sectionHeadingRow: {
    gap: spacing.md,
  },
  sectionHeadingText: {
    flex: 1,
    gap: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  sectionDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  addButton: {
    alignSelf: "flex-start",
    minWidth: 112,
  },
  prominentValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: "800",
  },
  typeOptions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  typeOption: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  typeOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  typeOptionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  typeOptionTextSelected: {
    color: colors.background,
  },
  pressed: {
    opacity: 0.8,
  },
  itemCard: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  metaText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  summaryRows: {
    gap: spacing.sm,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  label: {
    width: 72,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryValue: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    lineHeight: 21,
  },
  shortMultilineInput: {
    minHeight: 96,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  multilineInput: {
    minHeight: 128,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  savingNotice: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  savingTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
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
  noticeDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
