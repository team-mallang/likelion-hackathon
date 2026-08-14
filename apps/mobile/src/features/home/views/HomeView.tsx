import { StatusBar } from "expo-status-bar";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/common/button";
import { AppScreen } from "@/components/layout/AppScreen";
import { colors, radius, spacing } from "@/theme/tokens";

import type { HomeViewProps } from "./HomeView.types";

export function HomeView({
  onStartCase,
  onPreviousCase,
  onDocuments,
  onGuide,
}: HomeViewProps) {
  return (
    <AppScreen
      footer={
        <View style={styles.bottomNavigation}>
          <Pressable
            accessibilityRole="button"
            onPress={onGuide}
            style={styles.navigationItem}
          >
            <Text style={styles.navigationText}>가이드</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onDocuments}
            style={styles.navigationItem}
          >
            <Text style={styles.navigationText}>서류</Text>
          </Pressable>
        </View>
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
            <Button
              title="사건 발생·가이드 시작"
              onPress={onStartCase}
            />
            <Text style={styles.actionCaption}>로그인 없이 바로 시작</Text>
          </View>

          <View style={styles.actionItem}>
            <Button
              title="이전 사건 조회"
              onPress={onPreviousCase}
              variant="outline"
            />
            <Text style={styles.actionCaption}>진행 상황 조회</Text>
          </View>
        </View>

        <View
          accessibilityRole="alert"
          style={styles.emergencyNotice}
        >
          <Text style={styles.emergencyTitle}>긴급한 위험이 있나요?</Text>
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
    gap: spacing.xl,
  },
  brandSection: {
    alignItems: "center",
    gap: spacing.sm,
  },
  logoMark: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  logoLetter: {
    color: colors.background,
    fontSize: 32,
    fontWeight: "800",
  },
  serviceName: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  introduction: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
    textAlign: "center",
  },
  description: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
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
  actionCaption: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  emergencyNotice: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
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
  bottomNavigation: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navigationItem: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
});
