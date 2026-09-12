import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { DestinationCard } from "@/features/directions/components/DestinationCard";
import { DirectionsMap } from "@/features/directions/components/DirectionsMap";
import { TravelModeSelector } from "@/features/directions/components/TravelModeSelector";
import { formatRouteDistance, formatRouteDuration, getRouteCtaDisplay } from "@/features/directions/utils/directionDisplay";
import { transitStepArrivalTime, transitStepDepartureTime, transitStepHeadway, transitStepIcon, transitStepSummary, transitStepWaitTime } from "@/features/directions/utils/transitStepDisplay";
import { colors, radius, spacing } from "@/theme/tokens";
import type { RouteGuidance } from "@/features/directions/types/directions";

import type { DirectionsViewProps } from "./DirectionsView.types";

export function DirectionsViewShared(props: DirectionsViewProps) {
  const routeStatus = props.selectedRoute?.routeStatus ?? "FAILED";
  const cta = getRouteCtaDisplay(routeStatus);
  const canUseRoute = Boolean(props.destination && props.selectedTravelMode);
  const isRouteLoading = props.isLoadingRoute;
  const isNavigating = props.isTrackingLocation;
  const isPrimaryDisabled = !canUseRoute || isRouteLoading || isNavigating || (routeStatus === "READY" && !props.selectedRoute);
  const primaryLabel = isRouteLoading
    ? "경로를 준비하고 있어요"
    : isNavigating
      ? "경로 안내 중"
      : routeStatus === "READY"
        ? "이 경로로 안내 시작"
        : cta.label;
  const onPrimaryAction =
    routeStatus === "READY"
      ? props.onStartGuidance
      : routeStatus === "FAILED"
        ? props.onRetryRoute
        : props.onConfirmArrival;

  return (
    <SafeAreaView style={styles.safeArea}>
      <DirectionsHeader onBack={props.onBack} routeStatus={routeStatus} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DirectionsMap
          destination={props.destination}
          mapStatus={props.mapStatus}
          onOpenExternalDirections={props.onOpenExternalDirections}
          onSelectRoute={props.onSelectRoute}
          origin={props.origin}
          routeOptions={props.routeOptions}
          selectedRoute={props.selectedRoute}
        />
        <DestinationCard destination={props.destination} route={props.selectedRoute} />
        <TravelModeSelector
          availableModes={props.availableTravelModes}
          onSelectMode={props.onSelectTravelMode}
          selectedMode={props.selectedTravelMode}
        />

        {props.routeOptions.length > 0 ? (
          <View accessibilityLabel="경로 후보" style={styles.routeOptions}>
            <View style={styles.routeOptionsHeader}>
              <Text accessibilityRole="header" style={styles.routeOptionsTitle}>경로 선택</Text>
              <Text style={styles.routeOptionsCount}>{props.routeOptions.length}개 경로</Text>
            </View>
            {props.routeOptions.map((route, index) => {
              const isSelected = route.routeId === props.selectedRoute?.routeId;
              return (
                <Pressable
                  accessibilityLabel={`${index + 1}번 경로, ${routeOptionLabel(route)}`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isNavigating, selected: isSelected }}
                  disabled={isNavigating}
                  key={route.routeId}
                  onPress={() => props.onSelectRoute(route.routeId)}
                  style={({ pressed }) => [styles.routeOption, isSelected && styles.routeOptionSelected, pressed && styles.pressed]}
                >
                  <View style={styles.routeOptionText}>
                    <Text style={[styles.routeOptionTitle, isSelected && styles.routeOptionTitleSelected]}>{routeOptionLabel(route)}</Text>
                    <Text style={styles.routeOptionDistance}>
                      {[formatRouteDistance(route.distanceMeters), routeOptionSchedule(route, props.nowMs)].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Ionicons accessibilityElementsHidden color={isSelected ? colors.primary : colors.textSecondary} name={isSelected ? "checkmark-circle" : "ellipse-outline"} size={22} />
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {props.selectedTravelMode === "TRANSIT" && props.selectedRoute?.transitSteps?.length ? (
          <View accessibilityLabel="Transit route details" style={styles.transitSteps}>
            <Text style={styles.transitStepsTitle}>상세 경로</Text>
            {props.selectedRoute.transitSteps.map((step, index, steps) => {
              const summary = transitStepSummary(step);
              const boarding = [step.departureStop, step.lineName, step.headsign].filter(Boolean).join(" · ");
              const alighting = [step.arrivalStop, step.stopCount === undefined ? undefined : `${step.stopCount}정거장`].filter(Boolean).join(" · ");
              const departureTime = transitStepDepartureTime(step);
              const arrivalTime = transitStepArrivalTime(step);
              const schedule = [departureTime ? `${departureTime} 출발` : undefined, transitStepWaitTime(step, props.nowMs), arrivalTime ? `${arrivalTime} 도착` : undefined].filter(Boolean).join(" · ");
              const lineDetails = [step.agencyName, step.tripShortText ? `운행 ${step.tripShortText}` : undefined, transitStepHeadway(step)].filter(Boolean).join(" · ");
              return <View key={`${step.order}-${step.type}`} style={styles.transitStep}>
                <View style={styles.transitTimelineRail}>
                  <View style={[styles.transitTimelineIcon, step.type === "TRANSIT" && styles.transitTimelineIconTransit]}>
                    <Ionicons accessibilityElementsHidden color={step.type === "TRANSIT" ? colors.background : colors.primary} name={transitStepIcon(step)} size={18} />
                  </View>
                  {index < steps.length - 1 ? <View style={styles.transitTimelineLine} /> : null}
                </View>
                <View style={styles.transitStepText}>
                  {step.type === "WALK" ? <Text style={styles.transitStepPrimary}>{step.instruction ?? summary}</Text> : <>
                    {boarding ? <Text style={styles.transitStepPrimary}>{boarding}</Text> : null}
                    {alighting ? <Text style={styles.transitStepSecondary}>{alighting}</Text> : null}
                    {!boarding && !alighting && step.instruction ? <Text style={styles.transitStepPrimary}>{step.instruction}</Text> : null}
                  </>}
                  {step.type === "WALK" && step.instruction && summary ? <Text style={styles.transitStepSecondary}>{summary}</Text> : null}
                  {step.type === "TRANSIT" && summary ? <Text style={styles.transitStepSecondary}>{summary}</Text> : null}
                  {step.type === "TRANSIT" && schedule ? <Text style={styles.transitStepSchedule}>{schedule}</Text> : null}
                  {step.type === "TRANSIT" && lineDetails ? <Text style={styles.transitStepSecondary}>{lineDetails}</Text> : null}
                </View>
              </View>;
            })}
            <Text style={styles.transitScheduleNotice}>출발·도착 시각과 배차 간격은 예상 정보이며 실제 운행과 다를 수 있습니다.</Text>
          </View>
        ) : null}

        {props.errorMessage ? (
          <View accessibilityRole="alert" style={styles.errorNotice}>
            <Ionicons accessibilityElementsHidden color={colors.error} name="information-circle-outline" size={20} />
            <Text style={styles.errorText}>{props.errorMessage}</Text>
          </View>
        ) : null}

        <View accessibilityLabel="경로 안내 정보" style={styles.routeNotice}>
          <Ionicons accessibilityElementsHidden color={colors.primary} name="information-circle-outline" size={18} />
          <Text style={styles.routeNoticeText}>
            현재 위치에서 목적지까지의 경로입니다. 위치와 지도는 경로 안내에 필요한 동안에만 사용합니다.
          </Text>
        </View>

        <View accessibilityLabel="위치 개인정보 안내" style={styles.privacyNotice}>
          <Ionicons accessibilityElementsHidden color={colors.primary} name="shield-checkmark-outline" size={18} />
          <Text style={styles.privacyNoticeText}>
            위치는 경로 안내 중에만 사용하며, 이동 이력·좌표·경로를 저장하거나 분석에 사용하지 않습니다.
          </Text>
        </View>

        <Pressable
          accessibilityHint={cta.accessibilityHint}
          accessibilityLabel={cta.accessibilityLabel}
          accessibilityRole="button"
          accessibilityState={{ busy: isRouteLoading, disabled: isPrimaryDisabled }}
          disabled={isPrimaryDisabled}
          onPress={onPrimaryAction}
          style={({ pressed }) => [styles.primaryAction, isPrimaryDisabled && styles.disabled, pressed && styles.pressed]}
        >
          {isRouteLoading ? <Ionicons accessibilityElementsHidden color={colors.background} name="sync-outline" size={21} /> : null}
          <Text style={styles.primaryActionText}>{primaryLabel}</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="경찰서에 도착했어요"
          accessibilityRole="button"
          onPress={props.onArrivedAtPoliceStation}
          style={({ pressed }) => [styles.arrivalAction, pressed && styles.pressed]}
        >
          <Ionicons accessibilityElementsHidden color={colors.primary} name="checkmark-circle-outline" size={20} />
          <Text style={styles.arrivalActionText}>도착했어요</Text>
        </Pressable>

        <Pressable
          accessibilityLabel="외부 지도에서 길찾기"
          accessibilityRole="button"
          onPress={props.onOpenExternalDirections}
          style={({ pressed }) => [styles.externalAction, pressed && styles.pressed]}
        >
          <Ionicons accessibilityElementsHidden color={colors.primary} name="open-outline" size={18} />
          <Text style={styles.externalActionText}>외부 지도에서 보기</Text>
        </Pressable>
      </ScrollView>
      <CaseBottomNavigation activeTab="map" onCaseTab={props.onCaseTab} onDocumentsTab={props.onDocumentsTab} onGuideTab={props.onGuideTab} />
    </SafeAreaView>
  );
}

function routeOptionLabel(route: RouteGuidance) {
  const duration = formatRouteDuration(route.durationMinutes);
  const preference = route.routePreference === "FEWER_TRANSFERS" ? "최소 환승" : route.routePreference === "LESS_WALKING" ? "도보 적음" : undefined;
  if (route.travelMode !== "TRANSIT") {
    return [duration, preference, route.travelMode === "WALK" ? "도보" : "차량"].filter(Boolean).join(" · ");
  }

  const rides = route.transitSteps?.filter((step) => step.type === "TRANSIT") ?? [];
  if (rides.length === 0) return [duration, preference, "환승 없음"].filter(Boolean).join(" · ");
  if (rides.length === 1) return [duration, preference, `${transitVehicleLabel(rides[0]?.vehicleType)} 1회`].filter(Boolean).join(" · ");
  return [duration, preference, `환승 ${rides.length - 1}회`].filter(Boolean).join(" · ");
}

function routeOptionSchedule(route: RouteGuidance, nowMs: number) {
  const firstRide = route.transitSteps?.find((step) => step.type === "TRANSIT");
  if (!firstRide) return undefined;
  const departure = transitStepDepartureTime(firstRide);
  const wait = transitStepWaitTime(firstRide, nowMs);
  return [departure ? `${departure} 출발` : undefined, wait].filter(Boolean).join(" · ") || undefined;
}

function transitVehicleLabel(vehicleType: string | undefined) {
  if (vehicleType === "BUS" || vehicleType === "INTERCITY_BUS" || vehicleType === "TROLLEYBUS") return "버스";
  if (vehicleType === "SUBWAY" || vehicleType === "METRO_RAIL") return "지하철";
  return "대중교통";
}

function DirectionsHeader({ onBack, routeStatus }: Pick<DirectionsViewProps, "onBack"> & { routeStatus: "READY" | "NAVIGATING" | "ARRIVED" | "FAILED" }) {
  const statusText = routeStatus === "NAVIGATING" ? "안내 중" : routeStatus === "ARRIVED" ? "도착" : routeStatus === "FAILED" ? "경로 확인 필요" : "경로 준비";

  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="길찾기에서 뒤로가기" accessibilityRole="button" hitSlop={12} onPress={onBack} style={styles.headerSide}>
        <Ionicons accessibilityElementsHidden color={colors.text} name="arrow-back" size={26} />
      </Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>길찾기</Text>
      <Text accessibilityLabel={`경로 상태 ${statusText}`} style={styles.status}>{statusText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: { width: "100%", maxWidth: 480, minHeight: 60, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.sm, backgroundColor: colors.background },
  headerSide: { width: 48, minHeight: 44, alignItems: "center", justifyContent: "center", cursor: "pointer" },
  headerTitle: { flex: 1, minWidth: 0, color: colors.primary, fontSize: 18, fontWeight: "900", textAlign: "center" },
  status: { width: 72, flexShrink: 0, color: colors.textSecondary, fontSize: 11, fontWeight: "700", lineHeight: 16, textAlign: "right" },
  content: { width: "100%", maxWidth: 480, flexGrow: 1, alignSelf: "center", paddingBottom: spacing.xl },
  routeNotice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.primarySoft },
  routeNoticeText: { flex: 1, minWidth: 0, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  privacyNotice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.sm, padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.surface },
  privacyNoticeText: { flex: 1, minWidth: 0, color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  errorNotice: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.error, borderRadius: radius.md, backgroundColor: colors.errorSoft },
  errorText: { flex: 1, minWidth: 0, color: colors.error, fontSize: 13, lineHeight: 19 },
  routeOptions: { gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md },
  routeOptionsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  routeOptionsTitle: { color: colors.text, fontSize: 15, fontWeight: "900" },
  routeOptionsCount: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  routeOption: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background, cursor: "pointer" },
  routeOptionSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySoft },
  routeOptionText: { flex: 1, minWidth: 0 },
  routeOptionTitle: { color: colors.text, fontSize: 15, fontWeight: "800", lineHeight: 21 },
  routeOptionTitleSelected: { color: colors.primary },
  routeOptionDistance: { marginTop: 2, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  transitSteps: { marginHorizontal: spacing.md, marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background },
  transitStepsTitle: { color: colors.text, fontSize: 15, fontWeight: "900", marginBottom: spacing.sm },
  transitStep: { minHeight: 58, flexDirection: "row", alignItems: "stretch", gap: spacing.sm },
  transitTimelineRail: { width: 28, alignItems: "center" },
  transitTimelineIcon: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.primary, borderRadius: 14, backgroundColor: colors.background },
  transitTimelineIconTransit: { backgroundColor: colors.primary },
  transitTimelineLine: { width: 2, flex: 1, minHeight: 24, backgroundColor: colors.border },
  transitStepText: { flex: 1, minWidth: 0, gap: 2 },
  transitStepPrimary: { flexShrink: 1, color: colors.text, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  transitStepSecondary: { flexShrink: 1, color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  transitStepSchedule: { flexShrink: 1, color: colors.primary, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  transitScheduleNotice: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  primaryAction: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, borderRadius: radius.lg, backgroundColor: colors.primary, cursor: "pointer" },
  primaryActionText: { flexShrink: 1, color: colors.background, fontSize: 16, fontWeight: "900", textAlign: "center" },
  arrivalAction: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.sm, borderWidth: 1, borderColor: colors.primary, borderRadius: radius.lg, backgroundColor: colors.background, cursor: "pointer" },
  arrivalActionText: { flexShrink: 1, color: colors.primary, fontSize: 15, fontWeight: "900", textAlign: "center" },
  externalAction: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs, marginHorizontal: spacing.md, cursor: "pointer" },
  externalActionText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.72 },
});
