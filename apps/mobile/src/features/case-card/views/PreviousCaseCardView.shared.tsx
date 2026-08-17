import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { formatCaseNumber } from "@/features/case/utils/formatCaseNumber";
import { colors, radius, spacing } from "@/theme/tokens";

import type { PreviousCaseCardViewProps } from "./PreviousCaseCardView.types";

export function PreviousCaseCardView({
  caseCard,
  isLoading,
  errorMessage,
  onRetry,
  onCaseTab,
  onGuideTab,
  onDocumentsTab,
}: PreviousCaseCardViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Header />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <LoadingState message="이전 사건카드를 불러오고 있습니다." />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={onRetry} />
        ) : caseCard ? (
          <CaseCardContent caseCard={caseCard} />
        ) : null}
      </ScrollView>
      <CaseBottomNavigation
        onCaseTab={onCaseTab}
        onDocumentsTab={onDocumentsTab}
        onGuideTab={onGuideTab}
      />
    </SafeAreaView>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.headerEnd} />
      <Text style={styles.headerTitle}>사건카드 상세</Text>
      <View style={styles.headerEnd} />
    </View>
  );
}

function CaseCardContent({
  caseCard,
}: Pick<PreviousCaseCardViewProps, "caseCard"> & {
  caseCard: NonNullable<PreviousCaseCardViewProps["caseCard"]>;
}) {
  return (
    <View style={styles.stack}>
      <View style={styles.identityRow}>
        <Text style={styles.caseNumber}>사건 번호: {formatCaseNumber(caseCard.caseNumber)}</Text>
        <Text style={styles.status}>{caseCard.reportStatusLabel}</Text>
      </View>
      <Text style={styles.title}>{caseCard.title}</Text>

      <View style={styles.basicCard}>
        <InfoRow icon="warning-outline" label="사건 유형" value={caseCard.incidentTypeLabel} />
        <InfoRow icon="time-outline" label="발생 일시" value={formatDateTime(caseCard.occurredAt)} />
        <InfoRow icon="location-outline" label="발생 장소" value={caseCard.locationLabel ?? "확인되지 않음"} />
      </View>

      {caseCard.incidentDetails.length > 0 ? <View style={styles.basicCard}>
        <Text style={styles.sectionTitle}>사건 상세 정보</Text>
        {caseCard.incidentDetails.map((detail) => <InfoRow key={detail.label} icon="information-circle-outline" label={detail.label} value={detail.value} />)}
      </View> : null}

      <View style={styles.summaryCard}>
        <View style={styles.sectionHeader}>
          <Ionicons color={colors.primary} name="sparkles-outline" size={22} />
          <Text style={styles.summaryTitle}>AI 사건 요약</Text>
        </View>
        <Text style={styles.summaryText}>
          {caseCard.aiSummaryStatus === "READY" && caseCard.aiSummary
            ? caseCard.aiSummary
            : "이 사건의 AI 요약은 아직 제공되지 않습니다."}
        </Text>
      </View>

      <SectionTitle title="피해 물품 목록" />
      {caseCard.lostItems.length > 0 ? (
        <View style={styles.itemsCard}>
          {caseCard.lostItems.map((item, index) => (
            <View key={item.id} style={[styles.item, index > 0 && styles.itemDivider]}>
              <View style={styles.itemIcon}>
                <Ionicons color={colors.primary} name="briefcase-outline" size={21} />
              </View>
              <View style={styles.itemTextArea}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.description ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EmptySection message="등록된 피해 물품이 없습니다." />
      )}

      {caseCard.description ? <TextSection title="주요 정황 및 추가 단서" value={caseCard.description} /> : null}
      {caseCard.initialStatement ? <TextSection title="최초 진술" value={caseCard.initialStatement} /> : null}
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}><Ionicons color={colors.primary} name={icon} size={20} /></View>
      <View style={styles.infoTextArea}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function EmptySection({ message }: { message: string }) {
  return <View style={styles.emptySection}><Text style={styles.emptyText}>{message}</Text></View>;
}

function TextSection({ title, value }: { title: string; value: string }) {
  return (
    <View style={styles.textSection}>
      <SectionTitle title={title} />
      <Text style={styles.textSectionValue}>{value}</Text>
    </View>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "확인되지 않음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { minHeight: 52, alignItems: "center", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: spacing.md },
  headerTitle: { color: colors.primary, fontSize: 18, fontWeight: "800" },
  headerEnd: { width: 44 },
  content: { width: "100%", maxWidth: 480, alignSelf: "center", flexGrow: 1, padding: spacing.md },
  stack: { gap: spacing.md },
  identityRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  caseNumber: { borderRadius: radius.lg, backgroundColor: colors.primarySoft, color: colors.textSecondary, fontSize: 13, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  status: { borderRadius: radius.lg, backgroundColor: colors.primarySoft, color: colors.primary, fontSize: 13, fontWeight: "700", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  title: { color: colors.text, fontSize: 26, fontWeight: "800", lineHeight: 34 },
  basicCard: { gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.background, padding: spacing.lg },
  infoRow: { flexDirection: "row", gap: spacing.md },
  infoIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: colors.primarySoft },
  infoTextArea: { flex: 1, gap: spacing.xs },
  infoLabel: { color: colors.textSecondary, fontSize: 13 },
  infoValue: { color: colors.text, fontSize: 16, fontWeight: "700", lineHeight: 23 },
  summaryCard: { gap: spacing.sm, borderWidth: 1, borderColor: colors.primarySoft, borderRadius: radius.lg, backgroundColor: colors.background, padding: spacing.lg },
  sectionHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  summaryTitle: { color: colors.primary, fontSize: 19, fontWeight: "800" },
  summaryText: { color: colors.text, fontSize: 16, lineHeight: 25 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  itemsCard: { overflow: "hidden", borderRadius: radius.lg, backgroundColor: colors.background },
  item: { flexDirection: "row", gap: spacing.md, padding: spacing.md },
  itemDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  itemIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.primarySoft },
  itemTextArea: { flex: 1, gap: spacing.xs },
  itemTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  itemDescription: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  emptySection: { borderRadius: radius.md, backgroundColor: colors.background, padding: spacing.md },
  emptyText: { color: colors.textSecondary, fontSize: 14 },
  textSection: { gap: spacing.sm, borderRadius: radius.lg, backgroundColor: colors.background, padding: spacing.md },
  textSectionValue: { color: colors.textSecondary, fontSize: 15, lineHeight: 23 },
});
