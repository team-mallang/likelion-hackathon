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
import { CaseStatusCard } from "@/features/documents/components/CaseStatusCard";
import { DocumentListCard } from "@/features/documents/components/DocumentListCard";
import { EvidenceCard } from "@/features/documents/components/EvidenceCard";
import { colors, radius, spacing } from "@/theme/tokens";

import type { DocumentsViewProps } from "./DocumentsView.types";

export function DocumentsView({
  caseNumber,
  reportStatusLabel,
  progressPercent,
  documents,
  evidenceFiles,
  isLoading,
  errorMessage,
  copyFeedbackVisible,
  sharingEvidenceId,
  evidenceActionError,
  onBack,
  onRetry,
  onCopyCaseNumber,
  onOpenCaseGuide,
  onOpenDocument,
  onOpenEvidence,
  onShareEvidence,
  onCaseTab,
  onGuideTab,
  onDocumentsTab,
}: DocumentsViewProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <DocumentsHeader onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <LoadingState message="서류 정보를 불러오고 있습니다." />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={onRetry} />
        ) : (
          <>
            <CaseStatusCard
              caseNumber={caseNumber}
              reportStatusLabel={reportStatusLabel}
              progressPercent={progressPercent}
              copyFeedbackVisible={copyFeedbackVisible}
              onCopyCaseNumber={onCopyCaseNumber}
              onOpenCaseGuide={onOpenCaseGuide}
            />

            <DocumentSection
              documents={documents}
              onOpenDocument={onOpenDocument}
            />

            <EvidenceSection
              evidenceFiles={evidenceFiles}
              sharingEvidenceId={sharingEvidenceId}
              evidenceActionError={evidenceActionError}
              onOpenEvidence={onOpenEvidence}
              onShareEvidence={onShareEvidence}
            />

            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                문서 보기와 증빙 공유 기능은 후속 화면 및 파일 정책이
                확정되면 연결됩니다.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.bottomNavigation}>
        <NavigationItem label="사건" onPress={onCaseTab} />
        <NavigationItem label="가이드" onPress={onGuideTab} />
        <NavigationItem
          active
          label="서류"
          onPress={onDocumentsTab}
        />
      </View>
    </SafeAreaView>
  );
}

type DocumentsHeaderProps = Pick<DocumentsViewProps, "onBack">;

function DocumentsHeader({ onBack }: DocumentsHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="서류 화면에서 뒤로가기"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={styles.backButton}
      >
        <Text accessibilityElementsHidden style={styles.backLabel}>
          ←
        </Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        서류
      </Text>
    </View>
  );
}

type DocumentSectionProps = Pick<
  DocumentsViewProps,
  "documents" | "onOpenDocument"
>;

function DocumentSection({
  documents,
  onOpenDocument,
}: DocumentSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>작성된 서류</Text>
      {documents.length === 0 ? (
        <Text style={styles.emptyText}>아직 작성된 서류가 없습니다.</Text>
      ) : (
        documents.map((document) => (
          <DocumentListCard
            document={document}
            key={document.id}
            onOpen={onOpenDocument}
          />
        ))
      )}
    </View>
  );
}

type EvidenceSectionProps = Pick<
  DocumentsViewProps,
  | "evidenceFiles"
  | "sharingEvidenceId"
  | "evidenceActionError"
  | "onOpenEvidence"
  | "onShareEvidence"
>;

function EvidenceSection({
  evidenceFiles,
  sharingEvidenceId,
  evidenceActionError,
  onOpenEvidence,
  onShareEvidence,
}: EvidenceSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>증빙 자료</Text>
      {evidenceFiles.length === 0 ? (
        <Text style={styles.emptyText}>
          아직 등록된 증빙 자료가 없습니다.
        </Text>
      ) : (
        evidenceFiles.map((evidence) => (
          <EvidenceCard
            actionError={evidenceActionError}
            evidence={evidence}
            isSharing={sharingEvidenceId === evidence.id}
            key={evidence.id}
            onOpen={onOpenEvidence}
            onShare={onShareEvidence}
          />
        ))
      )}
    </View>
  );
}

type NavigationItemProps = {
  label: string;
  active?: boolean;
  onPress: () => void;
};

function NavigationItem({
  label,
  active = false,
  onPress,
}: NavigationItemProps) {
  return (
    <Pressable
      accessibilityLabel={`${label} 탭`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.navigationItem, active && styles.navigationItemActive]}
    >
      <Text
        style={[
          styles.navigationLabel,
          active && styles.navigationLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  backLabel: {
    color: colors.primary,
    fontSize: 24,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  content: {
    flexGrow: 1,
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  listCard: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  listTextArea: {
    flex: 1,
    gap: spacing.xs,
  },
  listTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  listDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  deliveryText: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  actionButton: {
    minWidth: 64,
    minHeight: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  emptyText: {
    padding: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  notice: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomNavigation: {
    minHeight: 64,
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  navigationItem: {
    minHeight: 44,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
  },
  navigationItemActive: {
    backgroundColor: colors.primary,
  },
  navigationLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  navigationLabelActive: {
    color: colors.background,
  },
});
