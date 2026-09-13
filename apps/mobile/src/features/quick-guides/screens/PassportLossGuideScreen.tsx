import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Alert,
  Linking,
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
  const [isPoliceReportVisible, setPoliceReportVisible] = useState(false);
  const [isConsulateVisible, setConsulateVisible] = useState(false);
  const [isPreparationVisible, setPreparationVisible] = useState(false);
  const [isDurationVisible, setDurationVisible] = useState(false);
  const [isTransitVisible, setTransitVisible] = useState(false);
  const [isFinalNoticeVisible, setFinalNoticeVisible] = useState(false);

  function startCaseGuide() {
    router.push("/case/new" as Href);
  }

  async function findNearbyPolice() {
    try {
      await Linking.openURL("https://www.google.com/maps/search/?api=1&query=%E4%BA%A4%E7%95%AA");
      setPoliceReportVisible(false);
    } catch {
      Alert.alert("지도를 열지 못했습니다", "지도 앱에서 '交番' 또는 '코반'을 검색해주세요.");
    }
  }

  async function findNearbyConsulate() {
    try {
      await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("대한민국 대사관 총영사관")}`);
      setConsulateVisible(false);
    } catch {
      Alert.alert("지도를 열지 못했습니다", "지도 앱에서 '대한민국 대사관' 또는 '대한민국 총영사관'을 검색해주세요.");
    }
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
          onPress={() => setPoliceReportVisible(true)}
        />
        <StepRow
          icon="business-outline"
          label="가까운 대한민국 공관 방문"
          number="3"
          onPress={() => setConsulateVisible(true)}
        />
        <StepRow
          icon="document-text-outline"
          label="긴급여권 신청 준비하기"
          number="4"
          onPress={() => setPreparationVisible(true)}
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
            onPress={() => setDurationVisible(true)}
          />
          <GuideRow
            icon="airplane"
            label="다른 국가를 경유한다면?"
            onPress={() => setTransitVisible(true)}
          />
          <GuideRow
            icon="alert-circle"
            label="반드시 확인해주세요"
            onPress={() => setFinalNoticeVisible(true)}
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
      <PoliceReportModal
        onClose={() => setPoliceReportVisible(false)}
        onFindPolice={() => void findNearbyPolice()}
        visible={isPoliceReportVisible}
      />
      <ConsulateModal
        onClose={() => setConsulateVisible(false)}
        onFindConsulate={() => void findNearbyConsulate()}
        visible={isConsulateVisible}
      />
      <PassportPreparationModal
        onClose={() => setPreparationVisible(false)}
        visible={isPreparationVisible}
      />
      <PassportDurationModal
        onClose={() => setDurationVisible(false)}
        visible={isDurationVisible}
      />
      <TransitCountryModal
        onClose={() => setTransitVisible(false)}
        visible={isTransitVisible}
      />
      <FinalPassportNoticeModal
        onClose={() => setFinalNoticeVisible(false)}
        visible={isFinalNoticeVisible}
      />
    </SafeAreaView>
  );
}

function FinalPassportNoticeModal({
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
          accessibilityLabel="여권 주의사항 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={[styles.modalCard, styles.durationModalCard]}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              반드시 확인해주세요
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

          <ScrollView contentContainerStyle={styles.finalNoticeContent} showsVerticalScrollIndicator={false}>
            <View style={styles.finalWarningIllustration}>
              <Ionicons color="#D7192D" name="warning" size={70} />
            </View>

            <PassportWarningCard
              description="여권 분실신고가 완료되면 기존 여권은 무효 처리되어 다시 찾더라도 사용할 수 없습니다."
              title="기존 여권은 다시 사용할 수 없습니다"
            />
            <PassportWarningCard
              description="최근 5년 이내 3회 이상 여권을 분실한 경우 긴급여권 발급이 제한될 수 있습니다."
              title="반복적인 분실은 발급이 제한될 수 있습니다"
            />
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

function PassportWarningCard({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <View accessibilityRole="alert" style={styles.passportWarningCard}>
      <Ionicons color="#D7192D" name="warning" size={23} />
      <View style={styles.passportWarningCopy}>
        <Text style={styles.passportWarningTitle}>{title}</Text>
        <Text style={styles.passportWarningDescription}>{description}</Text>
      </View>
    </View>
  );
}

function TransitCountryModal({
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
          accessibilityLabel="경유 국가 안내 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={[styles.modalCard, styles.durationModalCard]}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              다른 국가를 경유한다면?
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

          <ScrollView contentContainerStyle={styles.durationModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.transitIllustration}>
              <View style={styles.transitBackdrop} />
              <Ionicons color={colors.background} name="cloud" size={43} style={styles.transitCloudTop} />
              <Ionicons color={colors.background} name="cloud" size={48} style={styles.transitCloudBottom} />
              <Ionicons color="#3478F6" name="airplane" size={112} style={styles.transitPlane} />
            </View>

            <Text style={styles.durationHeading}>긴급여권은 비전자 단수여권입니다.</Text>
            <Text style={styles.durationDescription}>
              일본에서 한국으로 바로 귀국하는 것이 아니라 다른 국가를 경유하거나 방문하는 경우, 해당 국가에서 긴급여권의 입국·경유를 인정하는지 반드시 확인해주세요.
            </Text>

            <View style={styles.durationNotice}>
              <Ionicons color="#7890B5" name="information-circle-outline" size={21} />
              <Text style={styles.locationNoticeText}>
                출국 전 항공사 및 경유 국가의 최신 안내를 함께 확인하면 더 안전합니다.
              </Text>
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

function PassportDurationModal({
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
          accessibilityLabel="예상 발급 소요 시간 안내 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={[styles.modalCard, styles.durationModalCard]}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              예상 발급 소요 시간
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

          <ScrollView contentContainerStyle={styles.durationModalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.durationIllustration}>
              <Ionicons color="#4A8CFF" name="calendar" size={92} />
              <View style={styles.clockBadge}>
                <Ionicons color={colors.background} name="time" size={34} />
              </View>
            </View>

            <Text style={styles.durationHeading}>
              일반적으로 업무일 기준{"\n"}약 1~2일 정도 소요됩니다.
            </Text>
            <Text style={styles.durationDescription}>
              신청량, 시스템 상황 및 추가 본인확인 등으로 인해 더 오래 걸릴 수 있습니다.
            </Text>

            <View style={styles.durationNotice}>
              <Ionicons color="#7890B5" name="information-circle-outline" size={21} />
              <Text style={styles.locationNoticeText}>
                당일 발급이 보장되지는 않으니,{"\n"}여행 일정에 여유를 두고 신청하세요.
              </Text>
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

function PassportPreparationModal({
  onClose,
  visible,
}: {
  onClose: () => void;
  visible: boolean;
}) {
  const requirements = [
    "경찰 분실신고 접수증",
    "신분증 (주민등록증, 운전면허증 등)",
    "여권용 사진 (매수는 공관별 상이)",
    "긴급여권 발급 수수료 (금액은 공관별 상이)",
    "항공권 / E-ticket",
    "여권발급신청서 (공관에서 작성)",
    "여권분실신고서 (공관에서 작성)",
    "긴급여권 발급신청 사유서 (공관에서 작성)",
  ];

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
          accessibilityLabel="긴급여권 신청 준비 안내 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              4. 긴급여권 신청 준비하기
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
              <View style={styles.passportIllustration}>
                <Ionicons color="#DCE9FA" name="document-text" size={105} style={styles.applicationDocument} />
                <View style={styles.passportBook}>
                  <Ionicons color="#F4D84B" name="globe-outline" size={39} />
                  <Text style={styles.passportBookText}>PASSPORT</Text>
                </View>
              </View>

              <Text style={styles.modalDescription}>
                아래 준비물을 갖춰 대한민국 공관에 방문하여 긴급여권을 신청합니다.
              </Text>

              <View style={styles.requirementsCard}>
                <Text style={styles.consulateListTitle}>준비물</Text>
                {requirements.map((requirement) => (
                  <View key={requirement} style={styles.consulateListRow}>
                    <Text style={styles.consulateBullet}>•</Text>
                    <Text style={styles.requirementText}>{requirement}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.preparationNotice}>
                <Ionicons color={colors.textSecondary} name="information-circle-outline" size={20} />
                <Text style={styles.locationNoticeText}>
                  사진 매수와 수수료 등 세부 제출서류는 공관별로 다를 수 있으므로, 방문 전 해당 공관의 최신 안내를 확인해주세요.
                </Text>
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

function ConsulateModal({
  onClose,
  onFindConsulate,
  visible,
}: {
  onClose: () => void;
  onFindConsulate: () => void;
  visible: boolean;
}) {
  const consulates = [
    "주일본 대한민국 대사관 (도쿄)",
    "주오사카 대한민국 총영사관",
    "주후쿠오카 대한민국 총영사관",
    "주나고야 대한민국 총영사관",
    "주삿포로 대한민국 총영사관",
    "주니가타 대한민국 총영사관",
  ];

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
          accessibilityLabel="대한민국 공관 방문 안내 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              3. 가까운 대한민국 공관 방문
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
              <View style={styles.consulateIllustration}>
                <View style={styles.consulateBackdrop} />
                <Ionicons color="#77B9F4" name="business" size={104} />
                <View style={styles.koreanFlag}>
                  <View style={styles.flagRed} />
                  <View style={styles.flagBlue} />
                </View>
              </View>

              <Text style={styles.modalHeading}>
                경찰 신고 후 가까운 대한민국 대사관 또는 총영사관 등 재외공관을 방문하여 긴급여권을 신청하세요.
              </Text>

              <View style={styles.consulateListCard}>
                <Text style={styles.consulateListTitle}>일본 내 주요 공관 예시</Text>
                {consulates.map((consulate) => (
                  <View key={consulate} style={styles.consulateListRow}>
                    <Text style={styles.consulateBullet}>•</Text>
                    <Text style={styles.consulateName}>{consulate}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.locationNotice}>
                <Ionicons color={colors.textSecondary} name="information-circle-outline" size={20} />
                <Text style={styles.locationNoticeText}>
                  현재 위치를 기준으로 가장 가까운 공관을 확인할 수 있습니다.
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onFindConsulate}
            style={({ pressed }) => [styles.confirmButton, styles.findPoliceButton, pressed && styles.pressed]}
          >
            <Text style={styles.confirmButtonText}>가까운 한국 공관 찾기</Text>
            <Ionicons color={colors.background} name="arrow-forward" size={20} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PoliceReportModal({
  onClose,
  onFindPolice,
  visible,
}: {
  onClose: () => void;
  onFindPolice: () => void;
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
          accessibilityLabel="경찰서 분실신고 안내 닫기"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>
              2. 일본 경찰에 분실신고
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
              <View style={styles.policeIllustration}>
                <Ionicons color="#8EC5FF" name="business" size={96} />
                <View style={styles.policeSign}>
                  <Text style={styles.policeSignText}>POLICE</Text>
                </View>
                <Ionicons color="#F04444" name="ellipse" size={15} style={styles.policeLight} />
              </View>

              <View style={styles.modalCopy}>
                <Text style={styles.modalHeading}>
                  가까운 경찰서 또는 파출소에서{"\n"}여권 분실신고를 진행해주세요.
                </Text>
                <Text style={styles.modalDescription}>
                  일본에서는 파출소(交番, 코반)에서도 분실신고가 가능합니다.
                </Text>
              </View>

              <View style={styles.reportReceiptCard}>
                <View style={styles.reportReceiptTitleRow}>
                  <Ionicons color="#1268F5" name="checkmark-circle" size={24} />
                  <Text style={styles.reportReceiptTitle}>반드시 받아두세요</Text>
                </View>
                <View style={styles.reportReceiptTitleRow}>
                  <Ionicons color="#1268F5" name="checkmark-circle" size={20} />
                  <Text style={styles.reportReceiptName}>여권 분실신고 접수증</Text>
                </View>
                <Text style={styles.reportReceiptDescription}>
                  이 서류는 이후 대한민국 재외공관에서 긴급여권을 신청하거나, 일본 출국 시 필요할 수 있으므로 꼭 보관해주세요.
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onFindPolice}
            style={({ pressed }) => [styles.confirmButton, styles.findPoliceButton, pressed && styles.pressed]}
          >
            <Text style={styles.confirmButtonText}>가까운 경찰서 찾기</Text>
            <Ionicons color={colors.background} name="arrow-forward" size={20} />
          </Pressable>
        </View>
      </View>
    </Modal>
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
  policeIllustration: { height: 112, alignItems: "center", justifyContent: "flex-end", paddingTop: 12 },
  policeSign: { position: "absolute", bottom: 55, minWidth: 104, alignItems: "center", paddingVertical: 4, borderRadius: 4, backgroundColor: "#3268B8" },
  policeSignText: { color: colors.background, fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  policeLight: { position: "absolute", bottom: 82 },
  reportReceiptCard: { gap: 12, padding: 14, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  reportReceiptTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  reportReceiptTitle: { color: "#1268F5", fontSize: 13, fontWeight: "900" },
  reportReceiptName: { color: colors.text, fontSize: 14, fontWeight: "900" },
  reportReceiptDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  findPoliceButton: { flexDirection: "row", gap: 8 },
  consulateIllustration: { height: 142, alignItems: "center", justifyContent: "flex-end", overflow: "hidden" },
  consulateBackdrop: { position: "absolute", bottom: 0, width: 178, height: 128, borderTopLeftRadius: 90, borderTopRightRadius: 90, backgroundColor: "#EEF6FF" },
  koreanFlag: { position: "absolute", top: 7, width: 34, height: 27, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: colors.background },
  flagRed: { width: 12, height: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: "#ED344A" },
  flagBlue: { width: 12, height: 6, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, backgroundColor: "#2563C7" },
  consulateListCard: { gap: 7, padding: 14, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  consulateListTitle: { marginBottom: 2, color: "#1268F5", fontSize: 14, fontWeight: "900" },
  consulateListRow: { flexDirection: "row", gap: 9 },
  consulateBullet: { color: "#1268F5", fontSize: 17, lineHeight: 18, fontWeight: "900" },
  consulateName: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18 },
  locationNotice: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 2 },
  locationNoticeText: { flex: 1, color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  passportIllustration: { height: 128, alignItems: "center", justifyContent: "center" },
  applicationDocument: { position: "absolute", marginLeft: -68, transform: [{ rotate: "-10deg" }] },
  passportBook: { width: 82, height: 110, alignItems: "center", justifyContent: "center", gap: 14, marginLeft: 74, borderRadius: 5, backgroundColor: "#2D579B", transform: [{ rotate: "8deg" }], shadowColor: "#5574A5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 7, elevation: 4 },
  passportBookText: { color: colors.background, fontSize: 9, fontWeight: "900" },
  requirementsCard: { gap: 6, padding: 14, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  requirementText: { flex: 1, color: colors.text, fontSize: 11, lineHeight: 16 },
  preparationNotice: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  durationModalCard: { minHeight: "80%" },
  durationModalContent: { flexGrow: 1, gap: 16, paddingTop: 14 },
  durationIllustration: { height: 112, alignItems: "center", justifyContent: "center" },
  clockBadge: { position: "absolute", marginLeft: 75, marginTop: 48, width: 51, height: 51, alignItems: "center", justifyContent: "center", borderWidth: 4, borderColor: colors.background, borderRadius: 26, backgroundColor: "#3478F6" },
  durationHeading: { marginTop: 8, color: colors.text, fontSize: 20, lineHeight: 28, fontWeight: "900" },
  durationDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 21 },
  durationNotice: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 4, padding: 14, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  transitIllustration: { height: 174, alignItems: "center", justifyContent: "center" },
  transitBackdrop: { position: "absolute", width: 158, height: 158, borderRadius: 79, backgroundColor: "#EAF4FF" },
  transitCloudTop: { position: "absolute", marginLeft: -70, marginTop: -58 },
  transitCloudBottom: { position: "absolute", marginLeft: 84, marginTop: 64 },
  transitPlane: { transform: [{ rotate: "-10deg" }] },
  finalNoticeContent: { flexGrow: 1, gap: 14, paddingTop: 14 },
  finalWarningIllustration: { width: 96, height: 96, alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 2, borderRadius: 48, backgroundColor: "#FFE8E8" },
  passportWarningCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 13, borderWidth: 1, borderColor: "#FFC9C9", borderRadius: radius.md, backgroundColor: "#FFECEC" },
  passportWarningCopy: { flex: 1, gap: 6 },
  passportWarningTitle: { color: "#D7192D", fontSize: 13, lineHeight: 18, fontWeight: "900" },
  passportWarningDescription: { color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
});
