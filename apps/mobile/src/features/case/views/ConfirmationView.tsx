import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";
import { colors, radius, spacing } from "@/theme/tokens";

import type { ConfirmationViewProps } from "./ConfirmationView.types";

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
  riskLevelLabel,
  details,
  clues,
  isEditing,
  isSaving,
  isSaved,
  canConfirm,
  errorMessage,
  onBack,
  onCaseTypeChange,
  onCluesChange,
  onConfirm,
  onDetailsChange,
  onEditToggle,
  onItemAdd,
  onItemChange,
  onItemRemove,
  onLocationChange,
  onOccurredAtChange,
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
      <FlowHeader onBack={onBack} step="6/6" title="최종 확인" />
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

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>분석 결과</Text>
            <View style={styles.summaryRows}>
              <SummaryRow
                label="긴급 물품"
                value={emergencyItemIncluded ? "포함됨" : "포함되지 않음"}
              />
              <SummaryRow label="위험도" value={riskLevelLabel} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>상세 특징</Text>
            {isEditing ? (
              <AppTextInput
                label="상세 특징"
                multiline
                editable={!isSaving}
                onChangeText={onDetailsChange}
                placeholder="사건과 물품의 상세 특징을 입력해 주세요."
                style={styles.multilineInput}
                textAlignVertical="top"
                value={details}
              />
            ) : (
              <Text style={styles.value}>
                {details || "입력된 상세 특징이 없습니다."}
              </Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>추가 단서</Text>
            {isEditing ? (
              <AppTextInput
                label="추가 단서"
                multiline
                editable={!isSaving}
                onChangeText={onCluesChange}
                placeholder="마지막 확인 장소 등 추가 단서를 입력해 주세요."
                style={styles.multilineInput}
                textAlignVertical="top"
                value={clues}
              />
            ) : (
              <Text style={styles.value}>
                {clues || "입력된 추가 단서가 없습니다."}
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
