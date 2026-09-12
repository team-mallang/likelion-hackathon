import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/theme/tokens";

export function PassportLossGuideScreen() {
  const router = useRouter();
  const [isCheckpointVisible, setCheckpointVisible] = useState(false);

  function startCaseGuide() {
    router.push("/case/new" as Href);
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View accessibilityLabel="진행률 50퍼센트" style={styles.progressTrack}>
          <View style={styles.progressValue} />
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          여권 분실 긴급 행동 수칙
        </Text>

        <View accessibilityRole="alert" style={styles.warningCard}>
          <Ionicons color="#D93636" name="warning" size={24} />
          <Text style={styles.warningText}>
            <Text style={styles.warningStrong}>중요 안내 최우선: </Text>
            분실신고 후에는 기존 여권을 다시 찾아도 사용할 수 없습니다.
          </Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>
            순서대로 따라하세요 <Text style={styles.sectionAccent}>(필수 4단계)</Text>
          </Text>
          <Text style={styles.duration}>소요 5분 이내</Text>
        </View>

        <View style={styles.primaryStep}>
          <View style={styles.stepHeading}>
            <View style={styles.stepNumberActive}>
              <Text style={styles.stepNumberActiveText}>1</Text>
            </View>
            <View style={styles.importantBadge}>
              <Text style={styles.importantBadgeText}>중요</Text>
            </View>
            <Text style={styles.primaryStepTitle}>최근 방문 장소 먼저 확인</Text>
            <Ionicons color={colors.textSecondary} name="information-circle-outline" size={20} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setCheckpointVisible(true)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>여권 찾기 체크포인트 보기</Text>
            <Ionicons color={colors.background} name="arrow-forward" size={21} />
          </Pressable>
        </View>

        <StepRow
          icon="shield-outline"
          label="일본 경찰서(파출소) 분실신고"
          number="2"
          onPress={() => Alert.alert("경찰서 분실신고", "가까운 코반이나 경찰서에서 유실물 신고서(遺失届)를 접수하고 접수번호를 받아두세요.")}
        />
        <StepRow
          icon="business-outline"
          label="가까운 대한민국 공관 방문"
          number="3"
          onPress={() => Alert.alert("대한민국 공관 방문", "경찰 신고 접수증과 신분을 확인할 수 있는 자료를 준비해 가까운 대사관 또는 총영사관을 방문하세요.")}
        />
        <StepRow
          icon="document-text-outline"
          label="긴급여권 신청 준비하기"
          number="4"
          onPress={startCaseGuide}
          trailing={<Text style={styles.aiBadge}>AI 맞춤</Text>}
        />

        <View style={styles.additionalCard}>
          <View style={styles.additionalTitleRow}>
            <Ionicons color={colors.primary} name="clipboard-outline" size={23} />
            <Text style={styles.additionalTitle}>추가 안내</Text>
          </View>
          <GuideRow
            icon="time-outline"
            label="예상 발급 소요 시간"
            onPress={() => Alert.alert("예상 발급 소요 시간", "긴급여권 발급 시간은 공관과 당일 상황에 따라 달라질 수 있으니 방문 전 관할 공관에 확인해주세요.")}
          />
          <GuideRow
            icon="airplane"
            label="다른 국가를 경유한다면?"
            onPress={() => Alert.alert("경유 국가 확인", "긴급여권 인정 여부와 비자 필요 조건은 국가마다 다릅니다. 항공사와 경유국 공관에 반드시 확인해주세요.")}
          />
          <GuideRow
            icon="alert-circle"
            label="반드시 확인해주세요"
            onPress={() => Alert.alert("반드시 확인해주세요", "분실신고된 기존 여권은 다시 찾더라도 사용할 수 없습니다. 출국 전 새 여권과 항공권 정보를 다시 확인해주세요.")}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={startCaseGuide}
          style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
        >
          <Text style={styles.startButtonText}>여권 분실로 가이드 시작하기</Text>
          <Ionicons color={colors.background} name="arrow-forward" size={22} />
        </Pressable>
      </View>

      <CheckpointModal
        onClose={() => setCheckpointVisible(false)}
        visible={isCheckpointVisible}
      />
    </SafeAreaView>
  );
}

function CheckpointModal({
  onClose,
  visible,
}: {
  onClose: () => void;
  visible: boolean;
}) {
  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel="여권 찾기 체크포인트 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              1. 최근 방문 장소를 확인하세요
            </Text>
            <Pressable
              accessibilityLabel="닫기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={styles.modalCloseButton}
            >
              <Ionicons color={colors.text} name="close" size={22} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.findIllustration}>
                <Ionicons color="#DCEEFF" name="map" size={88} />
                <Ionicons color="#EF233C" name="location" size={31} style={styles.locationIcon} />
                <View style={styles.searchIcon}>
                  <Ionicons color="#1671F9" name="search" size={56} />
                </View>
              </View>

              <View style={styles.modalCopy}>
                <Text style={styles.modalHeading}>여권을 충분히 찾아보세요</Text>
                <Text style={styles.modalDescription}>
                  분실신고를 하기 전에 아래 장소에서 여권을 두고 온 것은 아닌지 먼저 확인해주세요.
                </Text>
              </View>

              <View style={styles.checkpointList}>
                <CheckpointItem label="숙박 중인 호텔" />
                <CheckpointItem label="음식점" />
                <CheckpointItem label="기차역 / 지하철역" />
                <CheckpointItem label="택시회사" />
                <CheckpointItem label="상점 / 관광시설" />
                <CheckpointItem label="최근 방문한 장소의 분실물 센터" />
              </View>

              <View accessibilityRole="alert" style={styles.modalWarning}>
                <Ionicons color="#D7192D" name="warning" size={23} />
                <View style={styles.modalWarningCopy}>
                  <Text style={styles.modalWarningTitle}>주의해주세요</Text>
                  <Text style={styles.modalWarningText}>
                    분실신고 후에는 여권을 다시 찾더라도 기존 여권을 사용할 수 없습니다.{"\n"}
                    반드시 충분히 확인한 뒤 다음 단계로 진행하세요.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}
          >
            <Text style={styles.confirmButtonText}>확인했어요</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CheckpointItem({ label }: { label: string }) {
  return (
    <View style={styles.checkpointItem}>
      <Text style={styles.checkpointBullet}>•</Text>
      <Text style={styles.checkpointText}>{label}</Text>
    </View>
  );
}

function StepRow({
  icon,
  label,
  number,
  onPress,
  trailing,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  number: string;
  onPress: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}
    >
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Ionicons color={colors.textSecondary} name={icon} size={20} />
      <Text style={styles.stepLabel}>{label}</Text>
      {trailing}
      <Ionicons color={colors.textSecondary} name="chevron-forward" size={19} />
    </Pressable>
  );
}

function GuideRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.guideRow, pressed && styles.pressed]}
    >
      <Ionicons color={colors.primary} name={icon} size={24} />
      <Text style={styles.guideLabel}>{label}</Text>
      <Ionicons color={colors.primary} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F8FD" },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", gap: 14, paddingHorizontal: spacing.md, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  progressTrack: { height: 6, marginTop: spacing.lg, borderRadius: 3, backgroundColor: "#DFE6F7", overflow: "hidden" },
  progressValue: { width: "49%", height: "100%", borderRadius: 3, backgroundColor: colors.primary },
  title: { marginTop: 4, color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900" },
  warningCard: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: "#FFBBB5", borderRadius: radius.lg, backgroundColor: "#FFDAD7" },
  warningText: { flex: 1, color: "#B52E2E", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  warningStrong: { fontWeight: "900" },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm, marginTop: 2 },
  sectionTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: "900" },
  sectionAccent: { color: colors.primary },
  duration: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  primaryStep: { gap: spacing.md, padding: spacing.md, borderWidth: 2, borderColor: "#8CB5FF", borderRadius: 20, backgroundColor: colors.background },
  stepHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepNumberActive: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: colors.primary },
  stepNumberActiveText: { color: colors.background, fontSize: 14, fontWeight: "900" },
  importantBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.lg, backgroundColor: "#D93030" },
  importantBadgeText: { color: colors.background, fontSize: 11, fontWeight: "900" },
  primaryStepTitle: { flex: 1, color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "900" },
  primaryButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.md, backgroundColor: "#075BE8" },
  primaryButtonText: { color: colors.background, fontSize: 15, fontWeight: "900" },
  stepRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: "#DCE2EE", borderRadius: radius.lg, backgroundColor: colors.background },
  stepNumber: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EDF1F8" },
  stepNumberText: { color: colors.text, fontSize: 13, fontWeight: "900" },
  stepLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "800" },
  aiBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, color: "#35436D", backgroundColor: "#DFE6FA", fontSize: 10, fontWeight: "900", overflow: "hidden" },
  additionalCard: { gap: 10, padding: spacing.md, borderWidth: 1, borderColor: "#C9DAFF", borderRadius: radius.lg, backgroundColor: colors.background },
  additionalTitleRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 2 },
  additionalTitle: { color: colors.primary, fontSize: 20, fontWeight: "900" },
  guideRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 14, borderRadius: radius.md, backgroundColor: "#F0F4FF" },
  guideLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "800" },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: "#E4E8F1", backgroundColor: colors.background },
  startButton: { width: "100%", maxWidth: 488, minHeight: 58, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, backgroundColor: "#1463F3" },
  startButtonText: { color: colors.background, fontSize: 16, fontWeight: "900" },
  pressed: { opacity: 0.72 },
  modalOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "rgba(15, 23, 42, 0.18)" },
  modalCard: { width: "100%", maxWidth: 430, maxHeight: "94%", gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.background, shadowColor: "#7A91B8", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 18, elevation: 8 },
  modalHeader: { minHeight: 34, flexDirection: "row", alignItems: "center", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#DCE2EE" },
  modalTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: "900" },
  modalCloseButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  modalBody: { gap: 13, paddingBottom: 2 },
  findIllustration: { height: 98, alignItems: "center", justifyContent: "center" },
  locationIcon: { position: "absolute", marginLeft: -28, marginTop: -15 },
  searchIcon: { position: "absolute", marginLeft: 70, marginTop: 2, transform: [{ rotate: "-8deg" }] },
  modalCopy: { gap: 5 },
  modalHeading: { color: colors.text, fontSize: 17, fontWeight: "900" },
  modalDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
  checkpointList: { gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderRadius: radius.md, backgroundColor: "#F1F6FF" },
  checkpointItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkpointBullet: { color: colors.primary, fontSize: 18, lineHeight: 18, fontWeight: "900" },
  checkpointText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  modalWarning: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderWidth: 1, borderColor: "#FFD1CD", borderRadius: radius.md, backgroundColor: "#FFF0EF" },
  modalWarningCopy: { flex: 1, gap: 4 },
  modalWarningTitle: { color: "#D7192D", fontSize: 13, fontWeight: "900" },
  modalWarningText: { color: colors.text, fontSize: 11, lineHeight: 17 },
  confirmButton: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: "#1268F5", shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  confirmButtonText: { color: colors.background, fontSize: 14, fontWeight: "900" },
});
