import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ErrorState } from "@/components/feedback/ErrorState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { AgencyMap } from "@/features/nearby-agencies/components/AgencyMap";
import { NearbyAgencyList } from "@/features/nearby-agencies/components/NearbyAgencyList";
import { SelectedAgencyCard } from "@/features/nearby-agencies/components/SelectedAgencyCard";
import { sortNearbyAgencies } from "@/features/nearby-agencies/utils/nearbyAgencyDisplay";
import { colors, radius, spacing } from "@/theme/tokens";

import type { NearbyAgenciesViewProps } from "./NearbyAgenciesView.types";

export function NearbyAgenciesViewShared(props: NearbyAgenciesViewProps) {
  const agencies = sortNearbyAgencies(props.agencies);
  const selectedAgency =
    agencies.find((agency) => agency.agencyId === props.selectedAgencyId) ??
    agencies.find((agency) => agency.isNearest) ??
    agencies[0] ??
    null;
  const isLoading = props.isLoadingLocation || props.isLoadingAgencies;

  return (
    <SafeAreaView style={styles.safeArea}>
      <NearbyAgenciesHeader onBack={props.onBack} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AgencyMap
          agencies={agencies}
          mapStatus={props.mapStatus}
          onRequestCurrentLocation={props.onRequestCurrentLocation}
          onSelectAgency={props.onSelectAgency}
          onToggleMapLayer={props.onToggleMapLayer}
          referenceLocation={props.referenceLocation}
          selectedAgencyId={selectedAgency?.agencyId ?? null}
        />

        {props.locationErrorMessage ? (
          <View accessibilityRole="alert" style={styles.inlineNotice}>
            <Ionicons
              accessibilityElementsHidden
              color={colors.error}
              name="location-outline"
              size={18}
            />
            <Text style={styles.inlineNoticeText}>{props.locationErrorMessage}</Text>
          </View>
        ) : null}

        <SelectedAgencyCard
          agency={selectedAgency}
          onCallAgency={props.onCallAgency}
          onOpenDirections={props.onOpenDirections}
        />

        <View style={styles.listHeading}>
          <Text accessibilityRole="header" style={styles.listTitle}>
            주변 기관 리스트
          </Text>
          <Text accessibilityLabel="현재 정렬 기준 거리순" style={styles.sortLabel}>
            거리순⌄
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.stateCard}>
            <LoadingState message="주변 기관을 찾고 있습니다." />
          </View>
        ) : props.agenciesErrorMessage ? (
          <View style={styles.stateCard}>
            <ErrorState
              message={props.agenciesErrorMessage}
              onRetry={props.onRetryAgencies}
            />
          </View>
        ) : agencies.length === 0 ? (
          <View style={styles.emptyList}>
            <Ionicons
              accessibilityElementsHidden
              color={colors.textSecondary}
              name="search-outline"
              size={28}
            />
            <Text style={styles.emptyListTitle}>주변 기관을 찾지 못했습니다.</Text>
            <Text style={styles.emptyListDescription}>
              위치를 다시 확인하거나 다른 위치에서 검색해 주세요.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={props.onRetryAgencies}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryButtonText}>다시 찾기</Text>
            </Pressable>
          </View>
        ) : (
          <NearbyAgencyList
            agencies={agencies}
            onSelectAgency={props.onSelectAgency}
            selectedAgencyId={selectedAgency?.agencyId ?? null}
          />
        )}

        <Pressable
          accessibilityLabel="모든 주변 기관 보기"
          accessibilityRole="button"
          onPress={props.onOpenAllAgencies}
          style={({ pressed }) => [styles.allAgenciesButton, pressed && styles.pressed]}
        >
          <Text style={styles.allAgenciesText}>모든 주변 기관 보기</Text>
          <Ionicons
            accessibilityElementsHidden
            color={colors.text}
            name="arrow-forward"
            size={18}
          />
        </Pressable>
      </ScrollView>

      <CaseBottomNavigation
        activeTab="guide"
        onCaseTab={props.onCaseTab}
        onDocumentsTab={props.onDocumentsTab}
        onGuideTab={props.onGuideTab}
      />
    </SafeAreaView>
  );
}

function NearbyAgenciesHeader({
  onBack,
}: Pick<NearbyAgenciesViewProps, "onBack">) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityLabel="주변 기관 안내에서 뒤로가기"
        accessibilityRole="button"
        hitSlop={12}
        onPress={onBack}
        style={styles.headerSide}
      >
        <Ionicons
          accessibilityElementsHidden
          color={colors.text}
          name="arrow-back"
          size={28}
        />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>
        주변 기관 안내
      </Text>
      <Text accessibilityLabel="신고 진행 단계 3 / 6" style={styles.progress}>
        3/6
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    width: "100%",
    maxWidth: 480,
    minHeight: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
  },
  headerSide: {
    width: 48,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  headerTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 23,
    fontWeight: "900",
    textAlign: "center",
  },
  progress: {
    width: 48,
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  content: {
    width: "100%",
    maxWidth: 480,
    flexGrow: 1,
    alignSelf: "center",
    paddingBottom: spacing.xl,
  },
  inlineNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    margin: spacing.md,
    marginBottom: 0,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
  },
  inlineNoticeText: { flex: 1, color: colors.error, fontSize: 12, lineHeight: 18 },
  listHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  listTitle: { color: colors.text, fontSize: 23, fontWeight: "900" },
  sortLabel: { color: colors.textSecondary, fontSize: 14, fontWeight: "700" },
  stateCard: {
    minHeight: 180,
    marginHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  emptyList: {
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  emptyListTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  emptyListDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  retryButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    cursor: "pointer",
  },
  retryButtonText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  allAgenciesButton: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
    cursor: "pointer",
  },
  allAgenciesText: { color: colors.text, fontSize: 16, fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
