import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  AccessibilityInfo,
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

const japanesePhrase = "クレジットカードを紛失しました。遺失届を出したいです。";
const mockCardIssuers = [
  { name: "신한카드", logo: "ShinhanCard", color: "#2456A6" },
  { name: "현대카드", logo: "Hyundai Card", color: "#202632" },
  { name: "삼성카드", logo: "Samsung Card", color: "#1769D2" },
  { name: "롯데카드", logo: "LOTTE CARD", color: "#D7193F" },
  { name: "토스뱅크", logo: "toss bank", color: "#2864E8" },
  { name: "하나카드", logo: "1Q Pay", color: "#00A894" },
  { name: "KB국민카드", logo: "KB Card", color: "#E2A800" },
  { name: "우리카드", logo: "WON CARD", color: "#1677D2" },
  { name: "NH농협카드", logo: "NH Card", color: "#159447" },
] as const;

export function CardLossGuideScreen() {
  const router = useRouter();
  const [isIssuerModalVisible, setIssuerModalVisible] = useState(false);

  function startCaseGuide() {
    router.push("/case/new" as Href);
  }

  function showCardFreezeGuide() {
    setIssuerModalVisible(true);
  }

  async function copyJapanesePhrase() {
    await Clipboard.setStringAsync(japanesePhrase);
    Alert.alert("복사 완료", "경찰관에게 제시할 일본어 문장을 복사했습니다.");
  }

  function listenToJapanesePhrase() {
    AccessibilityInfo.announceForAccessibility(japanesePhrase);
    Alert.alert(
      "발음 가이드",
      "쿠레짓토 카-도오 훈시츠시마시타. 이시츠토도케오 다시타이데스.",
    );
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="홈으로 돌아가기"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons color={colors.text} name="chevron-back" size={21} />
          </Pressable>
          <View style={styles.stageBadge}>
            <View style={styles.stageDot} />
            <Text style={styles.stageText}>긴급 조치 1단계 (총 2단계)</Text>
          </View>
          <Text style={styles.pageText}>Page 1 / 2</Text>
        </View>

        <View accessibilityLabel="진행률 50퍼센트" style={styles.progressTrack}>
          <View style={styles.progressValue} />
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          카드 분실 긴급 행동 수칙
        </Text>

        <View accessibilityRole="alert" style={styles.warningCard}>
          <Ionicons color="#D93636" name="warning" size={24} />
          <Text style={styles.warningText}>
            <Text style={styles.warningStrong}>도용 방지 최우선: </Text>
            분실 직후 1분 이내 일시정지가 가장 안전합니다.
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
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentBadgeText}>긴급</Text>
            </View>
            <Text style={styles.primaryStepTitle}>해외 카드 부정사용 방지 일시정지</Text>
            <Ionicons color={colors.textSecondary} name="information-circle-outline" size={20} />
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={showCardFreezeGuide}
            style={({ pressed }) => [styles.freezeButton, pressed && styles.pressed]}
          >
            <Text style={styles.freezeButtonText}>내 카드사 즉시 정지하러 가기</Text>
            <Ionicons color={colors.background} name="arrow-forward" size={21} />
          </Pressable>
        </View>

        <StepRow
          icon="receipt-outline"
          label="최근 승인 내역 확인"
          number="2"
          onPress={() => Alert.alert("승인 내역 확인", "카드사 앱에서 최근 승인 내역을 확인하고 모르는 결제가 있다면 즉시 카드사에 알려주세요.")}
        />
        <StepRow
          icon="shield-checkmark-outline"
          label="가까운 파출소(코반) 방문 접수"
          number="3"
          onPress={() => Alert.alert("분실 신고 접수", "카드를 정지한 뒤 가까운 코반에서 유실물 신고서(遺失届)를 접수해주세요.")}
        />
        <StepRow
          accent
          icon="sparkles"
          label="사건 가이드 시작하기"
          number="4"
          onPress={startCaseGuide}
          trailing={<Text style={styles.aiBadge}>AI 맞춤</Text>}
        />

        <View style={styles.phraseCard}>
          <View style={styles.phraseHeader}>
            <View style={styles.phraseTitleRow}>
              <Ionicons color={colors.primary} name="language-outline" size={21} />
              <Text style={styles.phraseTitle}>경찰관 제시용 일본어</Text>
            </View>
            <View style={styles.phraseActions}>
              <SmallAction icon="copy-outline" label="복사" onPress={() => void copyJapanesePhrase()} />
              <SmallAction icon="volume-high-outline" label="듣기" onPress={listenToJapanesePhrase} />
            </View>
          </View>

          <View style={styles.japaneseBox}>
            <View style={styles.quoteLine} />
            <View style={styles.japaneseTextArea}>
              <Text lang="ja" style={styles.japaneseText}>{japanesePhrase}</Text>
              <Text style={styles.pronunciation}>
                쿠레짓토 카-도오 훈시츠시마시타. 이시츠토도케오 다시타이데스.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          onPress={startCaseGuide}
          style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}
        >
          <Text style={styles.startButtonText}>해당 사건으로 가이드 시작하기</Text>
          <Ionicons color={colors.background} name="arrow-forward" size={22} />
        </Pressable>
      </View>

      <CardIssuerSelectionModal
        onClose={() => setIssuerModalVisible(false)}
        visible={isIssuerModalVisible}
      />
    </SafeAreaView>
  );
}

function CardIssuerSelectionModal({
  onClose,
  visible,
}: {
  onClose: () => void;
  visible: boolean;
}) {
  const [selectedIssuer, setSelectedIssuer] = useState<string | null>(null);

  function closeModal() {
    setSelectedIssuer(null);
    onClose();
  }

  function openMockFreezePage() {
    Alert.alert(
      `${selectedIssuer} 카드 정지`,
      "백엔드 연동 후 이 버튼에서 해당 카드사의 공식 카드 정지 페이지로 이동합니다.",
    );
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={closeModal}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          accessibilityLabel="카드사 찾기 닫기"
          onPress={closeModal}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleArea}>
              <View style={styles.modalIcon}>
                <Ionicons color={colors.primary} name="card-outline" size={24} />
              </View>
              <View style={styles.modalTitleTextArea}>
                <Text accessibilityRole="header" style={styles.modalTitle}>카드사를 선택해주세요</Text>
                <Text style={styles.modalDescription}>분실한 카드의 카드사를 선택하면 정지 페이지를 안내해드려요.</Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel="카드사 찾기 닫기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={closeModal}
              style={styles.modalCloseButton}
            >
              <Ionicons color={colors.textSecondary} name="close" size={23} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalBody}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <Text style={styles.cardSectionTitle}>신용·체크카드</Text>
          <View style={styles.issuerGrid}>
            {mockCardIssuers.map((issuer) => {
              const isSelected = selectedIssuer === issuer.name;

              return (
              <Pressable
                accessibilityLabel={`${issuer.name} 선택`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={issuer.name}
                onPress={() => setSelectedIssuer(issuer.name)}
                style={({ pressed }) => [
                  styles.issuerTile,
                  isSelected && styles.issuerTileSelected,
                  pressed && styles.pressed,
                ]}
              >
                {isSelected ? (
                  <View style={styles.tileCheck}>
                    <Ionicons color={colors.background} name="checkmark" size={13} />
                  </View>
                ) : null}
                <Text numberOfLines={1} style={[styles.issuerLogo, { color: issuer.color }]}> {issuer.logo} </Text>
                <Text style={[styles.issuerName, isSelected && styles.issuerNameSelected]}>{issuer.name}</Text>
              </Pressable>
              );
            })}
          </View>

          {selectedIssuer ? (
            <View style={styles.searchResultCard}>
              <View style={styles.resultHeading}>
                <View style={styles.resultCheck}>
                  <Ionicons color={colors.background} name="checkmark" size={18} />
                </View>
                <View style={styles.resultTextArea}>
                  <Text style={styles.resultEyebrow}>카드 정지 페이지를 찾았어요</Text>
                  <Text style={styles.resultTitle}>{selectedIssuer} 분실신고</Text>
                </View>
              </View>
              <Text style={styles.resultDescription}>
                카드사 공식 페이지에서 카드 일시정지 또는 분실신고를 진행할 수 있어요.
              </Text>
              <Pressable
                accessibilityRole="link"
                onPress={openMockFreezePage}
                style={({ pressed }) => [styles.resultButton, pressed && styles.pressed]}
              >
                <Text style={styles.resultButtonText}>카드 정지 페이지로 이동</Text>
                <Ionicons color={colors.background} name="open-outline" size={19} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.selectionHint}>
              <Ionicons color={colors.primary} name="hand-left-outline" size={18} />
              <Text style={styles.selectionHintText}>분실한 카드의 카드사를 눌러 선택해주세요.</Text>
            </View>
          )}

          <View style={styles.modalSafetyNotice}>
            <Ionicons color="#B54708" name="shield-checkmark-outline" size={19} />
            <Text style={styles.modalSafetyText}>
              이동 후 카드사 공식 페이지인지 확인하고 분실신고를 진행해주세요.
            </Text>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function StepRow({
  accent = false,
  icon,
  label,
  number,
  onPress,
  trailing,
}: {
  accent?: boolean;
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
      style={({ pressed }) => [
        styles.stepRow,
        accent && styles.stepRowAccent,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.stepNumber, accent && styles.stepNumberAccent]}>
        <Text style={[styles.stepNumberText, accent && styles.stepNumberAccentText]}>{number}</Text>
      </View>
      <Ionicons color={accent ? colors.primary : colors.textSecondary} name={icon} size={19} />
      <Text style={styles.stepLabel}>{label}</Text>
      {trailing}
      <Ionicons color={accent ? colors.primary : colors.textSecondary} name="chevron-forward" size={19} />
    </Pressable>
  );
}

function SmallAction({
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
      style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}
    >
      <Ionicons color={colors.primary} name={icon} size={17} />
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F8FD" },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", gap: 14, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.lg },
  topRow: { minHeight: 30, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: radius.lg, backgroundColor: colors.background },
  stageBadge: { minHeight: 28, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, borderRadius: radius.lg, backgroundColor: "#E7ECFF" },
  stageDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  stageText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  pageText: { marginLeft: "auto", color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#DFE6F7", overflow: "hidden" },
  progressValue: { width: "50%", height: "100%", borderRadius: 3, backgroundColor: colors.primary },
  title: { marginTop: 4, color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: "900" },
  warningCard: { minHeight: 66, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: spacing.md, paddingVertical: 12, borderRadius: radius.lg, backgroundColor: "#FFDAD7" },
  warningText: { flex: 1, color: "#B52E2E", fontSize: 13, lineHeight: 19, fontWeight: "600" },
  warningStrong: { fontWeight: "900" },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm },
  sectionTitle: { flex: 1, color: colors.text, fontSize: 18, fontWeight: "900" },
  sectionAccent: { color: colors.primary },
  duration: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  primaryStep: { gap: spacing.md, padding: spacing.md, borderWidth: 2, borderColor: "#8CB5FF", borderRadius: 20, backgroundColor: colors.background },
  stepHeading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  stepNumberActive: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: colors.primary },
  stepNumberActiveText: { color: colors.background, fontSize: 14, fontWeight: "900" },
  urgentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.lg, backgroundColor: "#D93030" },
  urgentBadgeText: { color: colors.background, fontSize: 11, fontWeight: "900" },
  primaryStepTitle: { flex: 1, color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "900" },
  freezeButton: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.md, backgroundColor: "#075BE8" },
  freezeButtonText: { color: colors.background, fontSize: 15, fontWeight: "900" },
  stepRow: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: "#DCE2EE", borderRadius: radius.lg, backgroundColor: colors.background },
  stepRowAccent: { borderColor: "#B8CFFF", backgroundColor: "#F0F4FF" },
  stepNumber: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EDF1F8" },
  stepNumberAccent: { backgroundColor: "#DCE6FF" },
  stepNumberText: { color: colors.textSecondary, fontSize: 13, fontWeight: "900" },
  stepNumberAccentText: { color: colors.primary },
  stepLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "800" },
  aiBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, color: "#35436D", backgroundColor: "#DFE6FA", fontSize: 10, fontWeight: "900", overflow: "hidden" },
  phraseCard: { gap: 12, padding: spacing.md, borderWidth: 1, borderColor: "#DCE2EE", borderRadius: radius.lg, backgroundColor: colors.background },
  phraseHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  phraseTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  phraseTitle: { color: colors.text, fontSize: 14, fontWeight: "900" },
  phraseActions: { flexDirection: "row", gap: 6 },
  smallAction: { minHeight: 32, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, borderWidth: 1, borderColor: "#D6E1FA", borderRadius: radius.sm, backgroundColor: "#F2F6FF" },
  smallActionText: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  japaneseBox: { minHeight: 96, flexDirection: "row", gap: 12, padding: 12, borderRadius: radius.sm, backgroundColor: "#F0F3FB" },
  quoteLine: { width: 3, borderRadius: 2, backgroundColor: colors.primary },
  japaneseTextArea: { flex: 1, gap: spacing.sm },
  japaneseText: { color: colors.text, fontSize: 15, lineHeight: 23, fontWeight: "800" },
  pronunciation: { color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: "#E4E8F1", backgroundColor: colors.background },
  startButton: { width: "100%", maxWidth: 488, minHeight: 58, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.lg, backgroundColor: "#326BFA" },
  startButtonText: { color: colors.background, fontSize: 16, fontWeight: "900" },
  pressed: { opacity: 0.72 },
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 23, 42, 0.5)" },
  modalSheet: { width: "100%", maxWidth: 520, maxHeight: "88%", alignSelf: "center", gap: 12, paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: spacing.lg, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.background },
  modalHandle: { width: 40, height: 4, alignSelf: "center", marginBottom: 2, borderRadius: 2, backgroundColor: "#D0D5DD" },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.sm },
  modalTitleArea: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  modalIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: radius.md, backgroundColor: colors.primarySoft },
  modalTitleTextArea: { flex: 1, gap: 3 },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "900" },
  modalDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  modalCloseButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: colors.surface },
  modalBody: { gap: 12, paddingBottom: 2 },
  cardSectionTitle: { marginTop: 4, color: colors.textSecondary, fontSize: 13, fontWeight: "800" },
  issuerGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingBottom: 2 },
  issuerTile: { position: "relative", width: "31%", minHeight: 82, flexGrow: 1, flexBasis: "30%", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingHorizontal: spacing.xs, borderWidth: 1, borderColor: "transparent", borderRadius: radius.md, backgroundColor: "#F5F6F8" },
  issuerTileSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: "#EEF3FF" },
  tileCheck: { position: "absolute", top: 7, right: 7, width: 20, height: 20, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: colors.primary },
  issuerLogo: { maxWidth: "90%", fontSize: 10, fontWeight: "900", letterSpacing: -0.3 },
  issuerName: { color: colors.text, fontSize: 12, fontWeight: "800" },
  issuerNameSelected: { color: colors.primary, fontWeight: "900" },
  searchResultCard: { gap: 12, padding: spacing.md, borderWidth: 1, borderColor: "#AFC7FF", borderRadius: radius.lg, backgroundColor: "#F2F6FF" },
  resultHeading: { flexDirection: "row", alignItems: "center", gap: 10 },
  resultCheck: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: colors.primary },
  resultTextArea: { flex: 1, gap: 2 },
  resultEyebrow: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  resultTitle: { color: colors.text, fontSize: 16, fontWeight: "900" },
  resultDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  resultButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primary },
  resultButtonText: { color: colors.background, fontSize: 14, fontWeight: "900" },
  selectionHint: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingHorizontal: 12, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  selectionHintText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  modalSafetyNotice: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: 12, borderRadius: radius.md, backgroundColor: "#FFF7E8" },
  modalSafetyText: { flex: 1, color: "#8A4B0F", fontSize: 11, lineHeight: 16, fontWeight: "600" },
});
