import { Ionicons } from "@expo/vector-icons";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { LocalizedText, PoliceReportDraft, PoliceReportField, PoliceReportItem, PoliceReportLanguage } from "@/features/police-report/types/policeReport";
import { colors, spacing } from "@/theme/tokens";

type Props = { draft: PoliceReportDraft; displayLanguage: PoliceReportLanguage; isRegenerating: boolean; isExporting: boolean; canExport: boolean; hasUnsavedChanges: boolean; regenerationErrorMessage: string | null; exportErrorMessage: string | null; isEditing: boolean; isSavingEdit: boolean; editValues: Record<string, string>; onEdit: () => void; onEditValueChange: (key: string, value: string) => void; onCancelEdit: () => void; onSaveEdit: () => void; onRegenerate: () => void; };
type FormRow = { id: string; ja: string; ko: string; value: string; missing?: boolean; editable?: boolean };
const MISSING = "미입력";
const REQUIRED = "현장 기입 필요";

export function PoliceReportDocument({ draft, displayLanguage, isRegenerating, isExporting, canExport, hasUnsavedChanges, regenerationErrorMessage, exportErrorMessage, isEditing, isSavingEdit, editValues, onEdit, onEditValueChange, onCancelEdit, onSaveEdit, onRegenerate }: Props) {
  const busy = isRegenerating || isExporting;
  const documentCopy = getDocumentCopy(draft.caseType);
  const headerSubtitle = draft.caseType === "LOST"
    ? "분실 신고서 초안"
    : documentCopy.titleKo;
  const headerGuide = draft.caseType === "LOST"
    ? "입력한 사건 정보를 바탕으로 작성된 참고용 초안입니다."
    : documentCopy.guide;
  return <View accessibilityLabel="일본 경찰 신고 정보 작성 가이드" style={styles.document}>
    <View style={styles.documentHeader}>
      <Text accessibilityLanguage="ja" style={styles.documentTitle}>{documentCopy.titleJa}</Text>
      <Text style={styles.documentSubtitle}>{headerSubtitle}</Text>
      <Text style={styles.documentGuide}>{headerGuide}</Text>
      {hasUnsavedChanges ? <Text style={styles.unsaved}>수정 내용 확인 필요</Text> : null}
    </View>
    {draft.status === "STALE" ? <Notice action="최신 정보로 다시 생성" loading={isRegenerating} message="사건 정보가 변경되었습니다. 최신 내용으로 다시 생성해주세요." onAction={onRegenerate} /> : null}
    {draft.status === "FAILED" ? <Notice action="다시 생성" error loading={isRegenerating} message="신고서 가이드를 생성하지 못했습니다." onAction={onRegenerate} /> : null}
    {draft.missingFieldIds.length ? <Notice message="일부 필수 정보가 없습니다. 현장에서 직접 기입하거나 사건 정보를 확인해주세요." /> : null}
    {isRegenerating ? <View accessibilityRole="progressbar" style={styles.loading}><ActivityIndicator color="#222" /><Text style={styles.loadingText}>최신 사건 정보로 다시 작성하고 있습니다.</Text></View> : null}
    {regenerationErrorMessage ? <Notice action="다시 생성" error message={regenerationErrorMessage} onAction={onRegenerate} /> : null}
    <View style={styles.formBody}>
      <Section number="1" ja="届出者情報" ko="신고자 정보"><Table required rows={applicantRows(draft.applicantFields, displayLanguage)} /></Section>
      <Section number="2" ja="遺失日時・場所" ko="분실 일시 및 장소"><Table editing={isEditing} editValues={editValues} onEditValueChange={onEditValueChange} rows={incidentRows(draft.incidentFields, displayLanguage)} /></Section>
      <Section number="3" ja="遺失状況" ko="분실 경위"><Narrative editing={isEditing} editValue={editValues.statement} onEditValueChange={onEditValueChange} value={draft.narrative[displayLanguage]} /></Section>
      <Section number="4" ja="遺失物" ko="분실 물품"><Items editing={isEditing} editValues={editValues} items={draft.items} language={displayLanguage} onEditValueChange={onEditValueChange} /></Section>
    </View>
    <View style={styles.actions}>
      {exportErrorMessage ? <Text accessibilityRole="alert" style={styles.actionError}>{exportErrorMessage}</Text> : null}
      <View style={styles.actionsRow}>{isEditing ? <><Action disabled={isSavingEdit} icon="close-outline" label="취소" onPress={onCancelEdit} /><Action dark disabled={isSavingEdit} icon="checkmark-outline" label="저장" loading={isSavingEdit} onPress={onSaveEdit} /></> : <Action disabled={busy} icon="pencil-outline" label="내용 수정" onPress={onEdit} />}</View>
    </View>
  </View>;
}

function getDocumentCopy(caseType: PoliceReportDraft["caseType"]) {
  if (caseType === "STOLEN") {
    return {
      titleJa: "盗難被害 申告情報",
      titleKo: "도난 신고 정보 정리",
      guide: "도난 사건은 단순 분실 신고(遺失届)와 처리 절차가 다를 수 있습니다. 아래 내용은 경찰에게 사건을 설명하고 신고서를 작성할 때 사용할 수 있는 정보입니다.",
    };
  }
  if (caseType === "UNKNOWN") {
    return {
      titleJa: "警察申告用 情報整理",
      titleKo: "경찰 신고용 정보 정리",
      guide: "현재 사건이 분실인지 도난인지 확정되지 않았습니다. 경찰에게 상황을 설명한 후 안내받은 신고 절차에 따라 작성해주세요.",
    };
  }
  return {
    titleJa: "遺失届",
    titleKo: "분실 신고서 작성 가이드",
    guide: "입력한 사건 정보를 일본 경찰의 유실물 신고서 작성에 활용할 수 있도록 정리했습니다. 경찰서에서 실제 양식에 옮겨 적을 때 참고해주세요.",
  };
}

function applicantRows(fields: PoliceReportField[], language: PoliceReportLanguage): FormRow[] {
  return [["reporter_name", "氏名", "성명"], ["reporter_address", "住所", "주소"], ["reporter_phone", "電話番号", "전화번호"], ["reporter_email", "メール", "이메일"], ["reporter_signature", "署名", "서명"]].map(([id, ja, ko]) => {
    const field = fields.find((candidate) => candidate.id === id);
    const missing = !field || field.missing || !valueOf(field, language, "");
    return { id, ja, ko, value: valueOf(field, language, REQUIRED), missing };
  });
}

function incidentRows(fields: PoliceReportField[], language: PoliceReportLanguage): FormRow[] {
  const map = new Map(fields.map((field) => [field.id, field]));
  const date = first(map, ["estimated_occurred_at", "last_seen_at", "discovered_at"]);
  const place = first(map, ["estimated_occurred_place", "last_seen_place", "discovered_place"]);
  const detail = ["route_after_last_seen", "storage_state", "case_description"].map((id) => valueOf(map.get(id), language, "")).filter(Boolean).join("\n");
  return [
    { id: date?.id ?? "estimated_occurred_at", ja: "遺失日時", ko: "분실 일시", value: date ? dateOf(valueOf(date, language, MISSING)) : MISSING, missing: !date || date.missing, editable: true },
    { id: place?.id ?? "estimated_occurred_place", ja: "遺失場所", ko: "분실 장소", value: valueOf(place, language, MISSING), missing: !place || place.missing, editable: true },
    { id: "detail", ja: "場所・状況の補足", ko: "장소 및 상황 보충", value: detail || MISSING, missing: !detail },
  ];
}

function first(map: Map<string, PoliceReportField>, ids: string[]) { return ids.map((id) => map.get(id)).find((field) => field && !field.missing && Boolean(valueOf(field, "ko", ""))) ?? map.get(ids[0]!); }
function valueOf(field: PoliceReportField | undefined, language: PoliceReportLanguage, fallback: string) { return field?.value[language].trim() || field?.value.ko.trim() || field?.value.ja.trim() || fallback; }
function localized(value: LocalizedText, language: PoliceReportLanguage) { return value[language].trim() || value.ko.trim() || value.ja.trim(); }
function dateOf(value: string) { if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return value; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : `${new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date)}頃`; }

function Section({ number, ja, ko, children }: { number: string; ja: string; ko: string; children: React.ReactNode }) { return <View style={styles.section}><View style={styles.sectionHeader}><Text style={styles.number}>{number}</Text><View><Text accessibilityLanguage="ja" style={styles.sectionJa}>{ja}</Text><Text style={styles.sectionKo}>{ko}</Text></View></View>{children}</View>; }
function Table({ rows, required = false, editing = false, editValues = {}, onEditValueChange }: { rows: FormRow[]; required?: boolean; editing?: boolean; editValues?: Record<string, string>; onEditValueChange?: (key: string, value: string) => void }) { return <View style={styles.table}>{rows.map((row) => <View key={row.id} style={styles.row}><View style={styles.label}><Text accessibilityLanguage="ja" style={styles.labelJa}>{row.ja}</Text><Text style={styles.labelKo}>{row.ko}</Text></View><View style={[styles.value, row.missing && styles.missingCell]}>{editing && row.editable && onEditValueChange ? <TextInput multiline value={editValues[row.id] ?? row.value} onChangeText={(value) => onEditValueChange(row.id, value)} style={styles.cellInput} /> : <Text style={[styles.valueText, row.missing && styles.missingText]}>{row.value || (required ? REQUIRED : MISSING)}</Text>}</View></View>)}</View>; }
function Narrative({ value, editing, editValue, onEditValueChange }: { value: string; editing: boolean; editValue?: string; onEditValueChange: (key: string, value: string) => void }) { const missing = !value.trim(); return <View style={[styles.narrative, missing && styles.missingCell]}><Text accessibilityLanguage="ja" style={styles.labelJa}>遺失状況</Text><Text style={styles.labelKo}>분실 상황</Text>{editing ? <TextInput multiline value={editValue ?? value} onChangeText={(next) => onEditValueChange("statement", next)} style={styles.narrativeInput} /> : <Text style={[styles.narrativeText, missing && styles.missingText]}>{missing ? MISSING : value}</Text>}</View>; }

function Items({ items, language, editing, editValues, onEditValueChange }: { items: PoliceReportItem[]; language: PoliceReportLanguage; editing: boolean; editValues: Record<string, string>; onEditValueChange: (key: string, value: string) => void }) {
  const sorted = [...items].sort((a, b) => a.order - b.order);
  if (!sorted.length) return <View style={styles.empty}><Text style={styles.missingText}>미입력</Text><Text style={styles.emptyHint}>분실 물품 정보를 확인해주세요.</Text></View>;
  return <View style={styles.itemList}>{sorted.map((item, index) => <Item editing={editing} editValues={editValues} item={item} key={item.id} language={language} number={index + 1} onEditValueChange={onEditValueChange} />)}</View>;
}
function Item({ item, number, language, editing, editValues, onEditValueChange }: { item: PoliceReportItem; number: number; language: PoliceReportLanguage; editing: boolean; editValues: Record<string, string>; onEditValueChange: (key: string, value: string) => void }) {
  const detail = (key: string) => stripFieldLabel(item.details.find((candidate) => candidate.id.endsWith(`_${key}`))?.text[language].trim() || "");
  const row = (id: string, ja: string, ko: string): FormRow => { const value = detail(id); return { id: `item_${item.order}_${id}`, ja, ko, value: value || MISSING, missing: !value, editable: true }; };
  const features = ["description", "identifying_feature", "shape", "contents_description", "phone_case_description"].map(detail).filter(Boolean).join("\n");
  const name = localized(item.title, language);
  const rows: FormRow[] = [
    { id: `item_${item.order}_name`, ja: "品名", ko: "물품명", value: name || MISSING, missing: !name, editable: true }, row("category", "種類", "종류"), row("quantity", "数量", "수량"), row("brand", "ブランド", "브랜드"), row("color", "色", "색상"), row("model", "型番", "모델"), { id: `item_${item.order}_description`, ja: "特徴", ko: "특징", value: features || MISSING, missing: !features, editable: true }, row("last_seen_place", "最後に確認した場所", "마지막 확인 장소"), { ...row("last_seen_at", "最後に確認した日時", "마지막 확인 일시"), value: dateOf(detail("last_seen_at") || MISSING) },
  ];
  return <View style={styles.item}><View style={styles.itemHeading}><Text accessibilityLanguage="ja" style={styles.itemJa}>遺失物 {number}</Text><Text style={styles.itemKo}>분실 물품 {number}</Text></View><Table editing={editing} editValues={editValues} onEditValueChange={onEditValueChange} rows={rows} /></View>;
}
function stripFieldLabel(value: string) { const separator = value.indexOf(":"); return separator >= 0 ? value.slice(separator + 1).trim() : value; }

function Notice({ message, error = false, action, loading = false, onAction }: { message: string; error?: boolean; action?: string; loading?: boolean; onAction?: () => void }) { return <View accessibilityRole="alert" style={[styles.notice, error && styles.errorNotice]}><Text style={[styles.noticeText, error && styles.errorText]}>{message}</Text>{action && onAction ? <Pressable accessibilityRole="button" disabled={loading} onPress={onAction} style={styles.noticeAction}>{loading ? <ActivityIndicator color="#222" size="small" /> : <Text style={styles.noticeActionText}>{action}</Text>}</Pressable> : null}</View>; }
function Action({ label, icon, dark = false, onPress, disabled = false, loading = false }: { label: string; icon: "pencil-outline" | "share-outline" | "close-outline" | "checkmark-outline"; dark?: boolean; onPress: () => void; disabled?: boolean; loading?: boolean }) { const inactive = disabled || loading; const color = dark ? "#fff" : "#111"; return <Pressable accessibilityRole="button" accessibilityState={{ busy: loading, disabled: inactive }} disabled={inactive} onPress={onPress} style={({ pressed }) => [styles.button, dark ? styles.darkButton : styles.lightButton, inactive && styles.inactive, pressed && !inactive && styles.pressed]}>{loading ? <ActivityIndicator color={color} /> : <><Ionicons accessibilityElementsHidden color={color} name={icon} size={18} /><Text style={[styles.buttonText, { color }]}>{label}</Text></>}</Pressable>; }

const styles = StyleSheet.create({
  document: { overflow: "hidden", borderWidth: 1, borderColor: "#555", backgroundColor: "#fff" }, documentHeader: { alignItems: "center", gap: 3, paddingHorizontal: spacing.md, paddingVertical: spacing.lg, borderBottomWidth: 2, borderBottomColor: "#222" }, documentTitle: { color: "#111", fontSize: 30, fontWeight: "900", letterSpacing: 5 }, documentSubtitle: { color: "#222", fontSize: 15, fontWeight: "800" }, documentGuide: { color: "#555", fontSize: 12, lineHeight: 18, textAlign: "center" }, unsaved: { color: colors.error, fontSize: 12, fontWeight: "700" },
  notice: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.sm, borderWidth: 1, borderColor: "#888", backgroundColor: "#f6f6f6" }, errorNotice: { borderColor: colors.error, backgroundColor: colors.errorSoft }, noticeText: { flex: 1, color: "#333", fontSize: 12, lineHeight: 18 }, errorText: { color: colors.error }, noticeAction: { minHeight: 36, justifyContent: "center", paddingHorizontal: spacing.xs }, noticeActionText: { color: "#111", fontSize: 12, fontWeight: "800", textDecorationLine: "underline" }, loading: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.sm, borderWidth: 1, borderColor: "#777" }, loadingText: { flex: 1, color: "#333", fontSize: 12 },
  formBody: { gap: spacing.lg, padding: spacing.md }, section: { gap: spacing.sm }, sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingBottom: spacing.xs, borderBottomWidth: 1, borderBottomColor: "#222" }, number: { width: 24, height: 24, color: "#fff", fontSize: 14, fontWeight: "800", lineHeight: 24, textAlign: "center", backgroundColor: "#222" }, sectionJa: { color: "#111", fontSize: 16, fontWeight: "900" }, sectionKo: { color: "#666", fontSize: 11 }, table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: "#777" }, row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#777" }, label: { width: "34%", justifyContent: "center", paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRightWidth: 1, borderRightColor: "#777", backgroundColor: "#eee" }, labelJa: { color: "#111", fontSize: 13, fontWeight: "800" }, labelKo: { color: "#666", fontSize: 10, marginTop: 2 }, value: { flex: 1, justifyContent: "center", minHeight: 48, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm }, valueText: { color: "#111", fontSize: 14, lineHeight: 21 }, missingCell: { backgroundColor: "#fafafa" }, missingText: { color: "#777", fontStyle: "italic" }, narrative: { minHeight: 156, padding: spacing.md, borderWidth: 1, borderColor: "#777" }, narrativeText: { color: "#111", fontSize: 14, lineHeight: 23, marginTop: spacing.sm },
  cellInput: { minHeight: 38, paddingHorizontal: spacing.xs, paddingVertical: spacing.xs, borderWidth: 1, borderColor: "#555", color: "#111", fontSize: 14, lineHeight: 20, textAlignVertical: "top" }, narrativeInput: { minHeight: 118, marginTop: spacing.sm, padding: spacing.sm, borderWidth: 1, borderColor: "#555", color: "#111", fontSize: 14, lineHeight: 23, textAlignVertical: "top" },
  itemList: { gap: spacing.md }, item: { gap: spacing.xs }, itemHeading: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderWidth: 1, borderColor: "#555", backgroundColor: "#e8e8e8" }, itemJa: { color: "#111", fontSize: 14, fontWeight: "900" }, itemKo: { color: "#666", fontSize: 10, marginTop: 1 }, empty: { alignItems: "center", gap: spacing.xs, minHeight: 72, justifyContent: "center", padding: spacing.md, borderWidth: 1, borderColor: "#777" }, emptyHint: { color: "#666", fontSize: 12 },
  actions: { gap: spacing.sm, padding: spacing.md, borderTopWidth: 2, borderTopColor: "#222", backgroundColor: "#fff" }, actionError: { color: colors.error, fontSize: 13, lineHeight: 19, textAlign: "center" }, actionsRow: { flexDirection: "row", gap: spacing.sm }, button: { minHeight: 52, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.sm }, lightButton: { borderWidth: 1, borderColor: "#222", backgroundColor: "#fff" }, darkButton: { backgroundColor: "#222" }, inactive: { opacity: 0.45 }, pressed: { opacity: 0.72 }, buttonText: { fontSize: 14, fontWeight: "800" },
});
