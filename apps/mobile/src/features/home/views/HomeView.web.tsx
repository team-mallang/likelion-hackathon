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
  <Text style={styles.serviceName}>SafeTrip JP</Text>

  <View style={styles.badgeBox}>
  <Text style={styles.badgeIcon}>🛡</Text>
  <Text style={styles.badge}>공식 여행자 안전 가이드</Text>
</View>
</View>

      <View style={styles.introduction}>
        <Text style={styles.title}>
  일본에서 도난·분실 사고를 {"\n"}겪으셨나요?
</Text>

        <Text style={styles.description}>
  상황을 알려주시면 지금 해야 할 일을 {"\n"} 순서대로 안내해 드릴게요.
</Text>
      </View>

      <View style={styles.actions}>
        <Pressable
  accessibilityRole="button"
  onPress={onStartCase}
  style={[styles.actionButton, styles.primaryButton]}
>
  <View style={styles.primaryIconBox}>
    <Text style={styles.primaryIcon}>⚠</Text>
  </View>

  <Text style={styles.primaryButtonTitle}>
  사건 발생·가이드시작
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
  <View style={styles.secondaryIconBox}>
    <Text style={styles.secondaryIcon}>↶</Text>
  </View>

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
  width: "100%",
  maxWidth: 720,
  alignSelf: "center",
  paddingHorizontal: 24,
},

  brandSection: {
  width: "100%",
  gap: 12,
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
  fontSize: 20,
  fontWeight: "700",
  color: "#2563EB",
},

  badgeBox: {
  alignSelf: "center",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 999,
  backgroundColor: "#EAF2FF",
  flexDirection: "row",
  alignItems: "center",
},

badgeIcon: {
  marginRight: 5,
  color: "#3B82F6",
  fontSize: 11,
  fontWeight: "700",
},
  badge: {
  color: "#3B82F6",
  fontSize: 13,
  fontWeight: "700",
},

  introduction: {
    marginTop: 32,
    gap: 10,
    alignItems: "center",
  },

  title: {
  fontSize: 28,
  fontWeight: "800",
  lineHeight: 38,
  textAlign: "center",
  maxWidth: 380,
},

  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  actions: {
  flexDirection: "row",
  gap: 16,
  marginTop: 24,
  justifyContent: "center",
},

  actionButton: {
  flex: 1,
    maxWidth: 280,
  minHeight: 180,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 12,
  padding: 16,
},

  primaryButton: {
    backgroundColor: "#2563EB",
  },

  primaryIconBox: {
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 10,
  borderRadius: 10,
  backgroundColor: "#FFFFFF33",
},

primaryIcon: {
  color: "#FFFFFF",
  fontSize: 22,
},

  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },

  secondaryIconBox: {
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 10,
  borderRadius: 10,
  backgroundColor: "#EFF6FF",
},

secondaryIcon: {
  color: "#6B7280",
  fontSize: 22,
},

  primaryButtonTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },

  primaryButtonCaption: {
    marginTop: 4,
    color: "#DBEAFE",
    fontSize: 12,
    textAlign: "center",
  },

  secondaryButtonTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",

  },

  secondaryButtonCaption: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 12,
    textAlign: "center",
  },

  emergencyNotice: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
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
  color: "#DC2626",
  fontSize: 14,
  lineHeight: 19,
  fontWeight: "600",
  textAlign: "center",
},

  copyright: {
    marginTop: 14,
    color: "#6B7280",
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