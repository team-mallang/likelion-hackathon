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
import { CaseStatusCard } from "@/features/documents/components/CaseStatusCard";
import { DocumentListCard } from "@/features/documents/components/DocumentListCard";
import { EvidenceCard } from "@/features/documents/components/EvidenceCard";
import { colors, radius, spacing } from "@/theme/tokens";

import type { DocumentsViewProps } from "./DocumentsView.types";

export function DocumentsViewShared({
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
  isInspectingEvidence,
  onBack,
  onRetry,
  onCopyCaseNumber,
  onOpenCaseGuide,
  onOpenDocument,
  onOpenEvidence,
  onShareEvidence,
  onCaptureEvidence,
  onOpenInsuranceProducts,
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
              isInspectingEvidence={isInspectingEvidence}
              onCaptureEvidence={onCaptureEvidence}
            />

            <View style={styles.notice}>
              <Ionicons
                accessibilityElementsHidden
                color={colors.primary}
                name="information-circle-outline"
                size={22}
              />
              <Text style={styles.noticeText}>
                문서 보기와 증빙 공유 기능은 후속 화면 및 파일 정책이
                확정되면 연결됩니다.
              </Text>
            </View>
            <Pressable accessibilityLabel="보험상품 확인하기" accessibilityRole="button" onPress={onOpenInsuranceProducts} style={styles.insuranceButton}><Text style={styles.insuranceButtonText}>보험상품 확인하기</Text><Text style={styles.insuranceButtonHint}>제휴 여행자보험 상품 보기</Text></Pressable>
          </>
        )}
      </ScrollView>

      <CaseBottomNavigation
        onCaseTab={onCaseTab}
        onGuideTab={onGuideTab}
        onDocumentsTab={onDocumentsTab}
      />
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
        focusable
        hitSlop={12}
        onPress={onBack}
        style={styles.backButton}
      >
        <Ionicons
          accessibilityElementsHidden
          color={colors.primary}
          name="arrow-back"
          size={24}
        />
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
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        작성된 서류
      </Text>
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
  | "isInspectingEvidence"
  | "onCaptureEvidence"
>;

function EvidenceSection({
  evidenceFiles,
  sharingEvidenceId,
  evidenceActionError,
  onOpenEvidence,
  onShareEvidence,
  isInspectingEvidence,
  onCaptureEvidence,
}: EvidenceSectionProps) {
  return (
    <View style={styles.section}>
      <Pressable disabled={isInspectingEvidence} onPress={onCaptureEvidence} style={styles.captureButton}>
        <Text style={styles.captureLabel}>{isInspectingEvidence ? "문서 검사 중" : "문서 촬영"}</Text>
      </Pressable>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        증빙 자료
      </Text>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    width: "100%",
    maxWidth: 480,
    minHeight: 52,
    alignSelf: "center",
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
    cursor: "pointer",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  content: {
    width: "100%",
    maxWidth: 480,
    flexGrow: 1,
    alignSelf: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  section: {
    gap: spacing.sm,
  },
  captureButton: { alignSelf: "flex-end", paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  captureLabel: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    padding: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  noticeText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  insuranceButton: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  insuranceButtonText: { color: colors.primary, fontSize: 16, fontWeight: "900" },
  insuranceButtonHint: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 12 },
});
