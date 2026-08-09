import { Pressable, StyleSheet, Text, View } from "react-native";

import type { HomeViewProps } from "./HomeView.types";

export function HomeView({
  onStartCase,
  onPreviousCase,
  onDocuments,
  onGuide,
}: HomeViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandSection}>
        <View style={styles.logoMark}>
          <Text style={styles.logoLetter}>S</Text>
        </View>

        <Text style={styles.serviceName}>SafeTrip JP</Text>
        <Text style={styles.badge}>공식 여행자 안전 가이드</Text>
      </View>

      <View style={styles.introduction}>
        <Text style={styles.title}>
          일본에서 도난·분실 사고를 겪으셨나요?
        </Text>

        <Text style={styles.description}>
          상황을 알려주시면 지금 해야 할 일을 순서대로 안내해 드릴게요.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={onStartCase}
          style={[styles.actionButton, styles.primaryButton]}
        >
          <Text style={styles.primaryButtonTitle}>
            사건 발생·가이드 시작
          </Text>
          <Text style={styles.primaryButtonCaption}>
            로그인 없이 바로 시작
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onPreviousCase}
          style={[styles.actionButton, styles.secondaryButton]}
        >
          <Text style={styles.secondaryButtonTitle}>
            이전 사건 조회
          </Text>
          <Text style={styles.secondaryButtonCaption}>
            진행 상황 조회
          </Text>
        </Pressable>
      </View>

      <View
        accessibilityRole="alert"
        style={styles.emergencyNotice}
      >
        <Text style={styles.emergencyTitle}>긴급 안내</Text>

        <Text style={styles.emergencyDescription}>
          현재 신체적인 위험이 있다면 서비스 이용보다 일본
          긴급신고(110/119)를 먼저 해야 합니다.
        </Text>
      </View>

      <Text style={styles.copyright}>
        © SafeTrip Japan Travel Assistance Service
      </Text>

      <View style={styles.bottomNavigation}>
        <Pressable
          accessibilityRole="button"
          onPress={onDocuments}
          style={styles.navigationItem}
        >
          <Text style={styles.navigationText}>서류</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={onGuide}
          style={styles.navigationItem}
        >
          <Text style={styles.navigationText}>가이드</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  brandSection: {
    alignItems: "center",
    gap: 8,
  },

  logoMark: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#2563EB",
  },

  logoLetter: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },

  serviceName: {
    fontSize: 28,
    fontWeight: "800",
  },

  badge: {
    fontSize: 13,
    fontWeight: "600",
  },

  introduction: {
    marginTop: 32,
    gap: 12,
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 42,
    textAlign: "center",
  },

  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },

  actions: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },

  actionButton: {
    flex: 1,
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 16,
  },

  primaryButton: {
    backgroundColor: "#2563EB",
  },

  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  primaryButtonTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  primaryButtonCaption: {
    marginTop: 4,
    color: "#DBEAFE",
    fontSize: 12,
  },

  secondaryButtonTitle: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButtonCaption: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 12,
  },

  emergencyNotice: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },

  emergencyTitle: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },

  emergencyDescription: {
    marginTop: 6,
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },

  copyright: {
    marginTop: 24,
    color: "#9CA3AF",
    fontSize: 11,
    textAlign: "center",
  },

  bottomNavigation: {
    flexDirection: "row",
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  navigationItem: {
    flex: 1,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  navigationText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
});