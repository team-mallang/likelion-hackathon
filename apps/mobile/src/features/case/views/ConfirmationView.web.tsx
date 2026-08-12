import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ProgressBar } from "@/components/layout/ProgressBar";

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
  const [hoveredControl, setHoveredControl] = useState<string | null>(null);
  const [focusedControl, setFocusedControl] = useState<string | null>(null);
  const confirmButtonTitle = isSaved
    ? "저장 완료"
    : errorMessage && canConfirm
      ? "다시 저장하기"
      : canConfirm
        ? "사건 내용 확정하기"
        : "필수 정보 확인하기";

  return (
    <>
      <FlowHeader onBack={onBack} title="분실·도난 신고" />
      <ProgressBar progress={1} />

      <AppScreen
        footer={
          <View style={styles.footerContent}>
            <Button
              title={confirmButtonTitle}
              onPress={onConfirm}
              loading={isSaving}
              disabled={isSaving || isSaved}
            />
          </View>
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>사건 내용을{"\n"}이렇게 정리했어요</Text>

          <View style={styles.typeCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.typeLabel}>사건 유형</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isSaving }}
                disabled={isSaving}
                onBlur={() => setFocusedControl(null)}
                onFocus={() => setFocusedControl("edit")}
                onHoverIn={() => setHoveredControl("edit")}
                onHoverOut={() => setHoveredControl(null)}
                onPress={onEditToggle}
                style={({ pressed }) => [
                  styles.editChip,
                  hoveredControl === "edit" && styles.editChipHovered,
                  focusedControl === "edit" && styles.editChipFocused,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.editChipText}>
                  {isEditing ? "수정 완료" : "수정"}
                </Text>
              </Pressable>
            </View>

            {isEditing ? (
              <View accessibilityRole="radiogroup" style={styles.typeOptions}>
                {CASE_TYPE_OPTIONS.map((option) => {
                  const selected = caseType === option.value;

                  return (
                    <Pressable
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected, disabled: isSaving }}
                      disabled={isSaving}
                      key={option.value}
                      onBlur={() => setFocusedControl(null)}
                      onFocus={() => setFocusedControl(`type-${option.value}`)}
                      onHoverIn={() => setHoveredControl(`type-${option.value}`)}
                      onHoverOut={() => setHoveredControl(null)}
                      onPress={() => onCaseTypeChange(option.value)}
                      style={({ pressed }) => [
                        styles.typeOption,
                        selected && styles.typeOptionSelected,
                        hoveredControl === `type-${option.value}` &&
                          styles.typeOptionHovered,
                        focusedControl === `type-${option.value}` &&
                          styles.typeOptionFocused,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          selected && styles.typeOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <Text style={styles.typeValue}>{caseTypeLabel}</Text>
            )}
          </View>

          <View style={styles.itemsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardLabel}>분실 물품</Text>
              {isEditing ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isSaving }}
                  disabled={isSaving}
                  onBlur={() => setFocusedControl(null)}
                  onFocus={() => setFocusedControl("add-item")}
                  onHoverIn={() => setHoveredControl("add-item")}
                  onHoverOut={() => setHoveredControl(null)}
                  onPress={onItemAdd}
                  style={({ pressed }) => [
                    styles.textAction,
                    hoveredControl === "add-item" && styles.textActionHovered,
                    focusedControl === "add-item" && styles.textActionFocused,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.textActionLabel}>+ 물품 추가</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  onBlur={() => setFocusedControl(null)}
                  onFocus={() => setFocusedControl("edit-items")}
                  onHoverIn={() => setHoveredControl("edit-items")}
                  onHoverOut={() => setHoveredControl(null)}
                  onPress={onEditToggle}
                  style={[
                    styles.textAction,
                    hoveredControl === "edit-items" && styles.textActionHovered,
                    focusedControl === "edit-items" && styles.textActionFocused,
                  ]}
                >
                  <Text style={styles.textActionLabel}>수정</Text>
                </Pressable>
              )}
            </View>

            {items.length === 0 ? (
              <Text style={styles.emptyText}>등록된 물품이 없습니다.</Text>
            ) : isEditing ? (
              <View style={styles.itemEditors}>
                {items.map((item, index) => (
                  <View key={item.id} style={styles.itemEditor}>
                    <Text style={styles.itemEditorTitle}>물품 {index + 1}</Text>
                    <AppTextInput
                      label="물품 이름"
                      editable={!isSaving}
                      onChangeText={(value) =>
                        onItemChange(item.id, { name: value })
                      }
                      value={item.name}
                    />
                    <AppTextInput
                      label="분류"
                      editable={!isSaving}
                      onChangeText={(value) =>
                        onItemChange(item.id, { category: value })
                      }
                      value={item.category ?? ""}
                    />
                    <AppTextInput
                      label="물품 특징"
                      multiline
                      editable={!isSaving}
                      onChangeText={(value) =>
                        onItemChange(item.id, { description: value })
                      }
                      style={styles.shortInput}
                      textAlignVertical="top"
                      value={item.description ?? ""}
                    />
                    <Button
                      title="이 물품 삭제"
                      onPress={() => onItemRemove(item.id)}
                      variant="outline"
                      disabled={isSaving}
                    />
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.itemTags}>
                {items.map((item, index) => (
                  <View key={item.id} style={styles.itemTag}>
                    <Text style={styles.itemIcon}>▣</Text>
                    <Text style={styles.itemTagText}>
                      {item.name || `물품 ${index + 1}`}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>발생 시간</Text>
              {isEditing ? (
                <AppTextInput
                  label="사건 발생 시간"
                  editable={!isSaving}
                  onChangeText={onOccurredAtChange}
                  value={occurredAtText}
                />
              ) : (
                <Text style={styles.summaryValue}>
                  {occurredAtText || "입력되지 않음"}
                </Text>
              )}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.cardLabel}>발생 장소</Text>
              {isEditing ? (
                <AppTextInput
                  label="사건 발생 장소"
                  editable={!isSaving}
                  onChangeText={onLocationChange}
                  value={locationText}
                />
              ) : (
                <Text style={styles.summaryValue}>
                  {locationText || "입력되지 않음"}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.statusGrid}>
            <View style={[styles.statusCard, styles.emergencyCard]}>
              <View style={[styles.statusIcon, styles.emergencyIcon]}>
                <Text style={styles.emergencyIconText}>!</Text>
              </View>
              <View style={styles.statusCopy}>
                <Text style={styles.statusLabel}>긴급 물품</Text>
                <Text style={styles.emergencyValue}>
                  {emergencyItemIncluded ? "여권 포함" : "포함 없음"}
                </Text>
              </View>
            </View>

            <View style={[styles.statusCard, styles.riskCard]}>
              <View style={[styles.statusIcon, styles.riskIcon]}>
                <Text style={styles.riskIconText}>♢</Text>
              </View>
              <View style={styles.statusCopy}>
                <Text style={styles.statusLabel}>위험도</Text>
                <Text style={styles.riskValue}>{riskLevelLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.cardLabel}>상세 특징 및 추가 단서</Text>
              {!isEditing ? (
                <Pressable
                  accessibilityRole="button"
                  disabled={isSaving}
                  onBlur={() => setFocusedControl(null)}
                  onFocus={() => setFocusedControl("edit-details")}
                  onHoverIn={() => setHoveredControl("edit-details")}
                  onHoverOut={() => setHoveredControl(null)}
                  onPress={onEditToggle}
                  style={[
                    styles.textAction,
                    hoveredControl === "edit-details" &&
                      styles.textActionHovered,
                    focusedControl === "edit-details" &&
                      styles.textActionFocused,
                  ]}
                >
                  <Text style={styles.textActionLabel}>수정</Text>
                </Pressable>
              ) : null}
            </View>

            {isEditing ? (
              <View style={styles.detailEditors}>
                <AppTextInput
                  label="물품 상세 특징"
                  multiline
                  editable={!isSaving}
                  onChangeText={onDetailsChange}
                  style={styles.detailInput}
                  textAlignVertical="top"
                  value={details}
                />
                <AppTextInput
                  label="추가 단서"
                  multiline
                  editable={!isSaving}
                  onChangeText={onCluesChange}
                  style={styles.detailInput}
                  textAlignVertical="top"
                  value={clues}
                />
              </View>
            ) : (
              <>
                <Text style={styles.detailLabel}>물품 상세 특징</Text>
                <Text style={styles.detailValue}>
                  {details || "입력된 상세 특징이 없습니다."}
                </Text>
                <View style={styles.divider} />
                <Text style={styles.detailLabel}>추가 단서</Text>
                <Text style={styles.detailValue}>
                  {clues || "입력된 추가 단서가 없습니다."}
                </Text>
              </>
            )}
          </View>

          {isSaving ? (
            <View accessibilityLiveRegion="polite" style={styles.savingNotice}>
              <Text style={styles.savingTitle}>사건 내용을 저장하고 있어요</Text>
              <Text style={styles.noticeText}>잠시만 기다려 주세요.</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View accessibilityRole="alert" style={styles.errorNotice}>
              <Text style={styles.errorTitle}>확인해 주세요</Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
            </View>
          ) : null}

          {isSaved ? (
            <View accessibilityLiveRegion="polite" style={styles.savedNotice}>
              <Text style={styles.savedTitle}>사건 내용이 저장되었습니다.</Text>
              <Text style={styles.noticeText}>
                다음 단계에서 사건번호와 비밀번호를 설정합니다.
              </Text>
            </View>
          ) : null}
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 12,
    paddingBottom: 24,
  },
  title: {
    marginBottom: 6,
    color: "#111827",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 36,
  },
  typeCard: {
    gap: 10,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#326CF6",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  typeLabel: {
    color: "#DCE8FF",
    fontSize: 12,
    fontWeight: "700",
  },
  typeValue: {
    color: "#061B4F",
    fontSize: 22,
    fontWeight: "900",
  },
  editChip: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF33",
  },
  editChipHovered: { backgroundColor: "#FFFFFF55" },
  editChipFocused: {
    outlineColor: "#FFFFFF",
    outlineStyle: "solid",
    outlineWidth: 2,
  },
  editChipText: { color: "#133B9B", fontSize: 13, fontWeight: "800" },
  typeOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeOption: {
    minWidth: 100,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#AFC8FF",
    borderRadius: 10,
    backgroundColor: "#FFFFFF22",
  },
  typeOptionSelected: { borderColor: "#FFFFFF", backgroundColor: "#FFFFFF" },
  typeOptionHovered: { borderColor: "#FFFFFF" },
  typeOptionFocused: {
    outlineColor: "#FFFFFF",
    outlineStyle: "solid",
    outlineWidth: 2,
  },
  typeOptionText: { color: "#EAF1FF", fontSize: 14, fontWeight: "800" },
  typeOptionTextSelected: { color: "#2563EB" },
  pressed: { opacity: 0.72 },
  itemsCard: {
    gap: 14,
    padding: 18,
    borderRadius: 16,
    backgroundColor: "#E8EEFC",
  },
  cardLabel: { color: "#64748B", fontSize: 12, fontWeight: "700" },
  textAction: {
    minHeight: 32,
    justifyContent: "center",
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  textActionHovered: { backgroundColor: "#DBE7FF" },
  textActionFocused: {
    outlineColor: "#2563EB",
    outlineStyle: "solid",
    outlineWidth: 2,
  },
  textActionLabel: { color: "#2563EB", fontSize: 13, fontWeight: "800" },
  itemTags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  itemTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#D3DAE8",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  itemIcon: { color: "#4B5563", fontSize: 13 },
  itemTagText: { color: "#374151", fontSize: 14, fontWeight: "700" },
  itemEditors: { gap: 12 },
  itemEditor: {
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D5DDED",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  itemEditorTitle: { color: "#1F2937", fontSize: 15, fontWeight: "800" },
  shortInput: { minHeight: 88, paddingTop: 12, paddingBottom: 12 },
  emptyText: { color: "#64748B", fontSize: 14, lineHeight: 21 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  summaryCard: {
    flexGrow: 1,
    flexBasis: 260,
    minHeight: 112,
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D8DEEA",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  summaryValue: { color: "#1F2937", fontSize: 17, fontWeight: "800", lineHeight: 24 },
  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statusCard: {
    flexGrow: 1,
    flexBasis: 240,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
  },
  emergencyCard: { backgroundColor: "#FFDCD7" },
  riskCard: { backgroundColor: "#EEF3FF" },
  statusIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  emergencyIcon: { backgroundColor: "#FFF2EF" },
  riskIcon: { backgroundColor: "#FFFFFF" },
  emergencyIconText: { color: "#DC2626", fontSize: 20, fontWeight: "900" },
  riskIconText: { color: "#64748B", fontSize: 20, fontWeight: "900" },
  statusCopy: { flex: 1, gap: 2 },
  statusLabel: { color: "#7C8799", fontSize: 12, fontWeight: "700" },
  emergencyValue: { color: "#DC2626", fontSize: 15, fontWeight: "900" },
  riskValue: { color: "#475569", fontSize: 15, fontWeight: "900" },
  detailsCard: {
    gap: 9,
    padding: 18,
    borderWidth: 1,
    borderColor: "#D8DEEA",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
  },
  detailLabel: { color: "#94A3B8", fontSize: 12, fontWeight: "700" },
  detailValue: { color: "#374151", fontSize: 14, fontWeight: "700", lineHeight: 21 },
  divider: { height: 1, marginVertical: 4, backgroundColor: "#E5E7EB" },
  detailEditors: { gap: 14 },
  detailInput: { minHeight: 104, paddingTop: 12, paddingBottom: 12 },
  savingNotice: { gap: 4, padding: 14, borderRadius: 12, backgroundColor: "#EEF3FF" },
  savingTitle: { color: "#2563EB", fontSize: 14, fontWeight: "800" },
  savedNotice: { gap: 4, padding: 14, borderRadius: 12, backgroundColor: "#ECFDF5" },
  savedTitle: { color: "#047857", fontSize: 14, fontWeight: "800" },
  noticeText: { color: "#64748B", fontSize: 13, lineHeight: 20 },
  errorNotice: { gap: 4, padding: 14, borderRadius: 12, backgroundColor: "#FEF2F2" },
  errorTitle: { color: "#DC2626", fontSize: 14, fontWeight: "800" },
  errorMessage: { color: "#DC2626", fontSize: 14, lineHeight: 21 },
  footerContent: { width: "100%", maxWidth: 720, alignSelf: "center" },
});
