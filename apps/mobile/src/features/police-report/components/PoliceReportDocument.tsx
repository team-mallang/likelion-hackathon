import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type {
  LocalizedText,
  PoliceReportDraft,
  PoliceReportField,
  PoliceReportLanguage,
} from "@/features/police-report/types/policeReport";
import { colors, radius, spacing } from "@/theme/tokens";

type PoliceReportDocumentProps = {
  draft: PoliceReportDraft;
  displayLanguage: PoliceReportLanguage;
  isRegenerating: boolean;
  isExporting: boolean;
  canExport: boolean;
  hasUnsavedChanges: boolean;
  regenerationErrorMessage: string | null;
  exportErrorMessage: string | null;
  onEdit: () => void;
  onRegenerate: () => void;
  onSaveOrShare: () => void;
};

export function PoliceReportDocument({
  draft,
  displayLanguage,
  isRegenerating,
  isExporting,
  canExport,
  hasUnsavedChanges,
  regenerationErrorMessage,
  exportErrorMessage,
  onEdit,
  onRegenerate,
  onSaveOrShare,
}: PoliceReportDocumentProps) {
  const isBusy = isRegenerating || isExporting;
  const hasMissingFields = draft.missingFieldIds.length > 0;

  return (
    <View
      accessibilityLabel="일본 경찰 제출용 피해 신고서 초안"
      style={styles.document}
    >
      <View style={styles.topAccent} />

      <View style={styles.documentTitleArea}>
        <Text accessibilityLanguage="ja" style={styles.documentTitle}>
          被害届
        </Text>
        <Text style={styles.documentRomanizedTitle}>HIGAITODOKE</Text>
        {hasUnsavedChanges ? (
          <Text style={styles.unsavedLabel}>수정 내용 확인 필요</Text>
        ) : null}
      </View>

      {draft.status === "STALE" ? (
        <StatusNotice
          actionLabel="최신 내용으로 다시 만들기"
          message="사건 정보가 변경되어 신고서 초안을 다시 확인해야 합니다."
          onAction={onRegenerate}
          tone="warning"
          loading={isRegenerating}
        />
      ) : null}

      {draft.status === "FAILED" ? (
        <StatusNotice
          actionLabel="다시 만들기"
          message="신고서 초안을 완성하지 못했습니다. 확인된 사건 정보로 다시 만들어 주세요."
          onAction={onRegenerate}
          tone="error"
          loading={isRegenerating}
        />
      ) : null}

      {hasMissingFields ? (
        <StatusNotice
          message="필수 정보가 비어 있습니다. 내용을 수정한 뒤 저장·공유해 주세요."
          tone="warning"
        />
      ) : null}

      {isRegenerating ? (
        <View
          accessibilityLabel="신고서 초안을 다시 만들고 있습니다."
          accessibilityRole="progressbar"
          style={styles.inlineLoading}
        >
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.inlineLoadingText}>
            변경된 사건 정보로 초안을 다시 만들고 있습니다.
          </Text>
        </View>
      ) : null}

      {regenerationErrorMessage ? (
        <StatusNotice
          actionLabel="다시 만들기"
          message={regenerationErrorMessage}
          onAction={onRegenerate}
          tone="error"
        />
      ) : null}

      <View style={styles.sections}>
        <ReportSection
          auxiliaryTitle="申告者情報"
          displayLanguage={displayLanguage}
          fields={draft.applicantFields}
          icon="person-outline"
          title="신고인 정보"
        />

        <ReportSection
          auxiliaryTitle="事件の概要"
          displayLanguage={displayLanguage}
          fields={draft.incidentFields}
          icon="calendar-outline"
          title="사건 개요"
        />

        <ReportItemsSection
          displayLanguage={displayLanguage}
          items={draft.items}
        />

        <NarrativeSection
          displayLanguage={displayLanguage}
          narrative={draft.narrative}
        />
      </View>

      <View style={styles.actionsArea}>
        {exportErrorMessage ? (
          <Text accessibilityRole="alert" style={styles.actionError}>
            {exportErrorMessage}
          </Text>
        ) : null}

        <View style={styles.actionsRow}>
          <DocumentActionButton
            disabled={isBusy}
            icon="pencil-outline"
            label="내용 수정"
            onPress={onEdit}
            variant="outline"
          />
          <DocumentActionButton
            disabled={!canExport || isRegenerating}
            icon="share-outline"
            label="저장/공유"
            loading={isExporting}
            onPress={onSaveOrShare}
            variant="primary"
          />
        </View>
      </View>
    </View>
  );
}

type ReportSectionProps = {
  title: string;
  auxiliaryTitle: string;
  icon: "person-outline" | "calendar-outline";
  fields: PoliceReportField[];
  displayLanguage: PoliceReportLanguage;
};

function ReportSection({
  title,
  auxiliaryTitle,
  icon,
  fields,
  displayLanguage,
}: ReportSectionProps) {
  return (
    <View style={styles.section}>
      <SectionHeading
        auxiliaryTitle={auxiliaryTitle}
        icon={icon}
        title={title}
      />
      <View style={styles.fields}>
        {fields.map((field) => (
          <ReportField
            displayLanguage={displayLanguage}
            field={field}
            key={field.id}
          />
        ))}
      </View>
    </View>
  );
}

type ReportFieldProps = {
  field: PoliceReportField;
  displayLanguage: PoliceReportLanguage;
};

function ReportField({ field, displayLanguage }: ReportFieldProps) {
  const label = field.label[displayLanguage];
  const value = field.value[displayLanguage];

  return (
    <View style={styles.fieldGroup}>
      <Text
        accessibilityLanguage={displayLanguage}
        style={styles.fieldLabel}
      >
        {label}
        {field.required ? " *" : ""}
      </Text>
      <View style={[styles.valueCard, field.missing && styles.missingCard]}>
        <Text
          accessibilityLanguage={displayLanguage}
          style={[styles.valueText, field.missing && styles.missingText]}
        >
          {field.missing || !value.trim()
            ? displayLanguage === "ja"
              ? "未確認"
              : "확인되지 않음"
            : value}
        </Text>
      </View>
    </View>
  );
}

type ReportItemsSectionProps = {
  items: PoliceReportDraft["items"];
  displayLanguage: PoliceReportLanguage;
};

function ReportItemsSection({
  items,
  displayLanguage,
}: ReportItemsSectionProps) {
  const sortedItems = [...items].sort((left, right) => left.order - right.order);

  return (
    <View style={styles.section}>
      <SectionHeading
        auxiliaryTitle="被害品"
        icon="briefcase-outline"
        title="피해 물품"
      />
      <Text
        accessibilityLanguage={displayLanguage}
        style={styles.fieldLabel}
      >
        {displayLanguage === "ja" ? "被害品目" : "피해 물품 목록"}
      </Text>

      {sortedItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>
            {displayLanguage === "ja"
              ? "確認された被害品はありません。"
              : "확인된 피해 물품이 없습니다."}
          </Text>
        </View>
      ) : (
        <View style={styles.itemList}>
          {sortedItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <Text
                accessibilityLanguage={displayLanguage}
                style={styles.itemTitle}
              >
                {item.order}. {item.title[displayLanguage]}
              </Text>
              {item.details.map((detail) => (
                <Text
                  accessibilityLanguage={displayLanguage}
                  key={detail.id}
                  style={styles.itemDetail}
                >
                  {detail.text[displayLanguage]}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

type NarrativeSectionProps = {
  narrative: LocalizedText;
  displayLanguage: PoliceReportLanguage;
};

function NarrativeSection({
  narrative,
  displayLanguage,
}: NarrativeSectionProps) {
  const value = narrative[displayLanguage];

  return (
    <View style={styles.section}>
      <SectionHeading
        auxiliaryTitle="被害状況の詳細"
        icon="chatbubble-ellipses-outline"
        title="피해 상황 상세"
      />
      <Text
        accessibilityLanguage={displayLanguage}
        style={styles.fieldLabel}
      >
        {displayLanguage === "ja" ? "当時の状況" : "당시 상황"}
      </Text>
      <View style={styles.narrativeCard}>
        <Text
          accessibilityLanguage={displayLanguage}
          style={styles.narrativeText}
        >
          {value.trim()
            ? value
            : displayLanguage === "ja"
              ? "未確認"
              : "확인되지 않음"}
        </Text>
      </View>
    </View>
  );
}

type SectionHeadingProps = {
  title: string;
  auxiliaryTitle: string;
  icon:
    | "person-outline"
    | "calendar-outline"
    | "briefcase-outline"
    | "chatbubble-ellipses-outline";
};

function SectionHeading({
  title,
  auxiliaryTitle,
  icon,
}: SectionHeadingProps) {
  return (
    <View style={styles.sectionHeading}>
      <Ionicons
        accessibilityElementsHidden
        color={colors.primary}
        name={icon}
        size={18}
      />
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      <Text accessibilityLanguage="ja" style={styles.sectionAuxiliaryTitle}>
        {auxiliaryTitle}
      </Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

type StatusNoticeProps = {
  message: string;
  tone: "warning" | "error";
  actionLabel?: string;
  loading?: boolean;
  onAction?: () => void;
};

function StatusNotice({
  message,
  tone,
  actionLabel,
  loading = false,
  onAction,
}: StatusNoticeProps) {
  return (
    <View
      accessibilityRole="alert"
      style={[
        styles.statusNotice,
        tone === "error" ? styles.errorNotice : styles.warningNotice,
      ]}
    >
      <Ionicons
        accessibilityElementsHidden
        color={tone === "error" ? colors.error : colors.textSecondary}
        name="alert-circle-outline"
        size={20}
      />
      <View style={styles.statusNoticeBody}>
        <Text
          style={[
            styles.statusNoticeText,
            tone === "error" && styles.errorNoticeText,
          ]}
        >
          {message}
        </Text>
        {actionLabel && onAction ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ busy: loading, disabled: loading }}
            disabled={loading}
            onPress={onAction}
            style={styles.noticeAction}
          >
            {loading ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Text style={styles.noticeActionText}>{actionLabel}</Text>
            )}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

type DocumentActionButtonProps = {
  label: string;
  icon: "pencil-outline" | "share-outline";
  variant: "primary" | "outline";
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

function DocumentActionButton({
  label,
  icon,
  variant,
  onPress,
  disabled = false,
  loading = false,
}: DocumentActionButtonProps) {
  const isDisabled = disabled || loading;
  const foreground = variant === "primary" ? colors.background : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === "primary"
          ? styles.primaryActionButton
          : styles.outlineActionButton,
        pressed && !isDisabled && styles.actionButtonPressed,
        isDisabled && styles.actionButtonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          <Ionicons
            accessibilityElementsHidden
            color={foreground}
            name={icon}
            size={18}
          />
          <Text style={[styles.actionButtonText, { color: foreground }]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  document: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  topAccent: {
    height: 6,
    backgroundColor: colors.primary,
  },
  documentTitleArea: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  documentTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
  },
  documentRomanizedTitle: {
    color: colors.text,
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 3,
  },
  unsavedLabel: {
    marginTop: spacing.xs,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  statusNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderRadius: radius.md,
  },
  warningNotice: {
    borderColor: colors.border,
    backgroundColor: colors.primarySoft,
  },
  errorNotice: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  statusNoticeBody: {
    flex: 1,
    gap: spacing.sm,
  },
  statusNoticeText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  errorNoticeText: {
    color: colors.error,
  },
  noticeAction: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    cursor: "pointer",
  },
  noticeActionText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  inlineLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  inlineLoadingText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  sections: {
    gap: spacing.lg,
    padding: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeading: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  sectionAuxiliaryTitle: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  sectionLine: {
    height: 1,
    flex: 1,
    backgroundColor: colors.border,
  },
  fields: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  valueCard: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  missingCard: {
    borderColor: colors.error,
    backgroundColor: colors.errorSoft,
  },
  valueText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  missingText: {
    color: colors.error,
  },
  itemList: {
    gap: spacing.sm,
  },
  itemCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  itemDetail: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  emptyCard: {
    minHeight: 72,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center",
  },
  narrativeCard: {
    minHeight: 148,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  narrativeText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  actionsArea: {
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  actionError: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    minHeight: 52,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    cursor: "pointer",
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
  },
  outlineActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  actionButtonPressed: {
    opacity: 0.8,
  },
  actionButtonDisabled: {
    opacity: 0.45,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
