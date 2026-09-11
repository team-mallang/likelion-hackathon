import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AppScreen } from "@/components/layout/AppScreen";
import { CaseBottomNavigation } from "@/features/documents/components/CaseBottomNavigation";
import { colors, radius, spacing } from "@/theme/tokens";

import type { HomeViewProps } from "./HomeView.types";

const quickStarts = [
  {
    type: "passport" as const,
    label: "여권 분실",
    icon: "document-text-outline" as const,
    color: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  {
    type: "card" as const,
    label: "카드 분실",
    icon: "card-outline" as const,
    color: "#5B4CF0",
    backgroundColor: "#EEECFF",
  },
  {
    type: "phone" as const,
    label: "휴대폰 분실",
    icon: "phone-portrait-outline" as const,
    color: "#E06B16",
    backgroundColor: "#FFF1E6",
  },
] as const;

export function HomeView({
  onStartCase,
  onQuickStart,
  onPreviousCase,
  onDocuments,
  onGuide,
  onMap,
}: HomeViewProps) {
  return (
    <AppScreen
      footer={
        <CaseBottomNavigation
          activeTab="guide"
          onDocumentsTab={onDocuments}
          onGuideTab={onGuide}
          onMapTab={onMap}
        />
      }
    >
      <StatusBar style="dark" />

      <View style={styles.container}>
        <View style={styles.brandSection}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>T</Text>
          </View>

          <Text style={styles.serviceName}>Travel Guard</Text>
        </View>

        <View style={styles.introduction}>
          <Text style={styles.title}>
            일본에서 도난·분실 사고를 겪으셨나요?
          </Text>

          <Text style={styles.description}>
            상황을 알려주시면 지금 해야 할 일을 순서대로 안내해드릴게요.
          </Text>
        </View>

        <View style={styles.actions}>
          <View style={styles.actionItem}>
            <Pressable
              accessibilityLabel="사건 발생 가이드 시작"
              accessibilityRole="button"
              onPress={onStartCase}
              style={({ pressed }) => [
                styles.actionButton,
                styles.primaryActionButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text style={[styles.actionButtonText, styles.primaryActionText]}>
                사건 발생·가이드 시작
              </Text>
            </Pressable>
            <Text style={styles.actionCaption}>로그인 없이 바로 시작</Text>
          </View>

          <View style={styles.actionItem}>
            <Pressable
              accessibilityLabel="이전 사건 조회"
              accessibilityRole="button"
              onPress={onPreviousCase}
              style={({ pressed }) => [
                styles.actionButton,
                styles.secondaryActionButton,
                pressed && styles.actionButtonPressed,
              ]}
            >
              <Text style={[styles.actionButtonText, styles.secondaryActionText]}>
                이전 사건 조회
              </Text>
            </Pressable>
            <Text style={styles.actionCaption}>진행 상황 조회</Text>
          </View>
        </View>

        <View style={styles.quickStartSection}>
          <View style={styles.quickStartHeading}>
            <Text style={styles.quickStartTitle}>자주 겪는 사고 빠른 시작</Text>
            <Text style={styles.quickStartHint}>상황별 가이드</Text>
          </View>

          <View style={styles.quickStartCard}>
            {quickStarts.map((item) => (
              <Pressable
                accessibilityHint={`${item.label} 신고 내용을 미리 입력하고 시작합니다.`}
                accessibilityLabel={`${item.label} 빠른 시작`}
                accessibilityRole="button"
                key={item.type}
                onPress={() => onQuickStart(item.type)}
                style={({ pressed }) => [
                  styles.quickStartItem,
                  pressed && styles.quickStartItemPressed,
                ]}
              >
                <View
                  style={[
                    styles.quickStartIcon,
                    { backgroundColor: item.backgroundColor },
                  ]}
                >
                  <Ionicons color={item.color} name={item.icon} size={22} />
                </View>
                <Text style={styles.quickStartLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View
          accessibilityRole="alert"
          style={styles.emergencyNotice}
        >
          <View style={styles.emergencyHeading}>
            <Ionicons color={colors.error} name="alert-circle" size={17} />
            <Text style={styles.emergencyTitle}>긴급한 위험이 있나요?</Text>
          </View>
          <Text style={styles.emergencyDescription}>
            신체적인 위험이 있다면 서비스 이용보다 일본 긴급 신고 번호
            110 또는 119를 먼저 이용해주세요.
          </Text>
        </View>

        <Text style={styles.copyright}>
          © Travel Guard Japan Travel Assistance Service
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: spacing.md,
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
  brandSection: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logoMark: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  logoLetter: {
    color: colors.background,
    fontSize: 24,
    fontWeight: "800",
  },
  serviceName: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
  },
  introduction: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
    lineHeight: 29,
    textAlign: "center",
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionItem: {
    flex: 1,
    gap: spacing.xs,
  },
  actionButton: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  primaryActionButton: {
    backgroundColor: colors.primary,
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  actionButtonPressed: {
    opacity: 0.75,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  primaryActionText: {
    color: colors.background,
  },
  secondaryActionText: {
    color: colors.text,
  },
  actionCaption: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  quickStartSection: {
    gap: spacing.sm,
  },
  quickStartHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  quickStartTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  quickStartHint: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "600",
  },
  quickStartCard: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  quickStartItem: {
    flex: 1,
    minHeight: 78,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  quickStartItemPressed: {
    opacity: 0.65,
  },
  quickStartIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  quickStartLabel: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  emergencyNotice: {
    flexDirection: "column",
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
  },
  emergencyHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  emergencyTitle: {
    color: colors.error,
    fontSize: 15,
    fontWeight: "700",
  },
  emergencyDescription: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  copyright: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: "center",
  },
});
