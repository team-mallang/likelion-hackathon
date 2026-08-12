import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { colors, radius, spacing } from "@/theme/tokens";

import type { ReportDocumentReviewViewProps } from "./ReportDocumentReviewView.types";

function statusLabel(status: ReportDocumentReviewViewProps["reviewStatus"]) {
  if (status === "READY_FOR_DOCUMENTS") return "검수 완료";
  if (status === "REVIEW_REQUIRED") return "검수 필요";
  if (status === "LOADING") return "확인 중";
  return "확인 실패";
}

export function ReportDocumentReviewViewShared(props: ReportDocumentReviewViewProps) {
  const isLoading = props.reviewStatus === "LOADING";
  const canMove = props.reviewStatus === "READY_FOR_DOCUMENTS" && Boolean(props.photoUri);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="신고서 확인에서 뒤로가기" accessibilityRole="button" hitSlop={12} onPress={props.onBack} style={styles.headerSide}>
          <Ionicons accessibilityElementsHidden color={colors.primary} name="arrow-back" size={27} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.headerTitle}>신고서 확인</Text>
        <View style={styles.headerSide} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionHeading}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>문서 확인</Text>
          <View accessibilityLabel={`검수 상태 ${statusLabel(props.reviewStatus)}`} style={styles.statusBadge}>
            <Ionicons accessibilityElementsHidden color={colors.primary} name={props.reviewStatus === "READY_FOR_DOCUMENTS" ? "checkmark-circle-outline" : "alert-circle-outline"} size={18} />
            <Text style={styles.statusText}>{statusLabel(props.reviewStatus)}</Text>
          </View>
        </View>

        <View accessibilityLabel="촬영한 신고서 사진 미리보기" style={styles.photoFrame}>
          {props.photoUri ? <Image accessibilityLabel="촬영한 신고서 사진 미리보기" resizeMode="contain" source={{ uri: props.photoUri }} style={styles.photo} /> : <Text style={styles.emptyPhoto}>사진을 확인할 수 없습니다.</Text>}
        </View>

        <View style={styles.extractHeading}>
          <Ionicons accessibilityElementsHidden color={colors.primary} name="sparkles-outline" size={22} />
          <View style={styles.extractBody}>
            <Text style={styles.extractTitle}>문서 정보 확인</Text>
            <Text style={styles.extractDescription}>추출된 정보가 정확한지 확인하고 필요하면 수정해 주세요.</Text>
          </View>
        </View>

        {props.errorMessage ? <View accessibilityRole="alert" style={styles.errorCard}><Ionicons accessibilityElementsHidden color={colors.error} name="information-circle-outline" size={20} /><Text style={styles.errorText}>{props.errorMessage}</Text></View> : null}
        {isLoading ? <View accessibilityLabel="문서 정보를 준비하고 있습니다" style={styles.loadingCard}><Text style={styles.loadingText}>문서 정보를 준비하고 있습니다.</Text></View> : props.fields.map((field) => {
          const editing = props.editingField === field.key;
          return <View key={field.key} style={styles.fieldCard}>
            <View style={styles.fieldTop}><Text style={styles.fieldLabel}>{field.label}</Text>{field.confidence === "LOW" ? <Text style={styles.lowConfidence}>확인 필요</Text> : null}</View>
            {editing ? <View style={styles.editRow}><TextInput accessibilityLabel={`${field.label} 입력`} autoFocus onChangeText={(value) => props.onChangeField(field.key, value)} style={styles.input} value={field.value} /><Pressable accessibilityLabel={`${field.label} 저장`} accessibilityRole="button" onPress={() => props.onSaveField(field.key)}><Text style={styles.saveText}>저장</Text></Pressable><Pressable accessibilityLabel={`${field.label} 수정 취소`} accessibilityRole="button" onPress={props.onCancelField}><Text style={styles.cancelText}>취소</Text></Pressable></View> : <View style={styles.valueRow}><Text style={styles.fieldValue}>{field.value || "입력 필요"}</Text>{field.editable ? <Pressable accessibilityLabel={`${field.label} 수정`} accessibilityRole="button" onPress={() => props.onEditField(field.key)}><Ionicons accessibilityElementsHidden color={colors.primary} name="pencil-outline" size={22} /></Pressable> : null}</View>}
            {editing && props.fieldError ? <Text accessibilityRole="alert" style={styles.fieldError}>{props.fieldError}</Text> : null}
          </View>;
        })}

        <View accessibilityLabel="보험 제출 전 확인 안내" style={styles.insuranceCard}><Ionicons accessibilityElementsHidden color={colors.primary} name="shield-checkmark-outline" size={28} /><View style={styles.insuranceBody}><Text style={styles.insuranceTitle}>보험 제출 전 확인</Text><Text style={styles.insuranceText}>필수 항목을 확인했습니다. 보험사별 제출 요건은 다를 수 있으니 제출 전에 다시 확인해 주세요.</Text></View></View>
        <Pressable accessibilityHint="검수된 문서 정보를 서류함에 반영합니다." accessibilityLabel="서류함으로 이동" accessibilityRole="button" accessibilityState={{ disabled: !canMove, busy: isLoading }} disabled={!canMove || isLoading} onPress={props.onMoveToDocuments} style={({ pressed }) => [styles.primaryButton, (!canMove || isLoading) && styles.disabled, pressed && styles.pressed]}><Ionicons accessibilityElementsHidden color={colors.background} name="folder-open-outline" size={22} /><Text style={styles.primaryText}>서류함으로 이동</Text></Pressable>
        <Pressable accessibilityLabel="다시 촬영하기" accessibilityRole="button" disabled={isLoading} onPress={props.onRetake} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed, isLoading && styles.disabled]}><Ionicons accessibilityElementsHidden color={colors.text} name="camera-outline" size={22} /><Text style={styles.secondaryText}>다시 촬영하기</Text></Pressable>
      </ScrollView>
      <CaseBottomNavigation activeTab="documents" onCaseTab={props.onCaseTab} onDocumentsTab={props.onDocumentsTab} onGuideTab={props.onGuideTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { width: "100%", maxWidth: 480, minHeight: 64, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, backgroundColor: colors.background },
  headerSide: { width: 48, minHeight: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, color: colors.primary, fontSize: 22, fontWeight: "900", textAlign: "center" },
  content: { width: "100%", maxWidth: 480, flexGrow: 1, alignSelf: "center", padding: spacing.md, paddingBottom: spacing.xl },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 27, fontWeight: "900" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  statusText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  photoFrame: { minHeight: 300, alignItems: "center", justifyContent: "center", overflow: "hidden", borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background },
  photo: { width: "100%", height: 300 },
  emptyPhoto: { color: colors.textSecondary, fontSize: 14 },
  extractHeading: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.sm },
  extractBody: { flex: 1 },
  extractTitle: { color: colors.text, fontSize: 18, fontWeight: "900" },
  extractDescription: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  fieldCard: { marginTop: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.background },
  fieldTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fieldLabel: { color: colors.textSecondary, fontSize: 13 },
  lowConfidence: { color: colors.error, fontSize: 12, fontWeight: "800" },
  valueRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  fieldValue: { flex: 1, color: colors.text, fontSize: 19, fontWeight: "700" },
  editRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: spacing.xs },
  input: { flex: 1, minHeight: 44, paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.sm, color: colors.text, fontSize: 16 },
  saveText: { color: colors.primary, fontWeight: "900" },
  cancelText: { color: colors.textSecondary, fontWeight: "800" },
  fieldError: { marginTop: spacing.xs, color: colors.error, fontSize: 12 },
  infoCard: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  errorCard: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.error, borderRadius: radius.md, backgroundColor: colors.errorSoft },
  errorText: { flex: 1, color: colors.error, fontSize: 13, lineHeight: 19 },
  loadingCard: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, textAlign: "center" },
  insuranceCard: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  insuranceBody: { flex: 1 },
  insuranceTitle: { color: colors.text, fontSize: 17, fontWeight: "900" },
  insuranceText: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  primaryButton: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.primary },
  secondaryButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background },
  primaryText: { color: colors.background, fontSize: 17, fontWeight: "900" },
  secondaryText: { color: colors.text, fontSize: 17, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
});
