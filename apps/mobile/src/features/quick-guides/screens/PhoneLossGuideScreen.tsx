import { Ionicons } from "@expo/vector-icons";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Alert, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "@/theme/tokens";

export function PhoneLossGuideScreen() {
  const router = useRouter();
  const [isDeviceLockVisible, setDeviceLockVisible] = useState(false);
  const [isCarrierReportVisible, setCarrierReportVisible] = useState(false);
  const [isPoliceReportVisible, setPoliceReportVisible] = useState(false);
  const [isAccountProtectionVisible, setAccountProtectionVisible] = useState(false);
  const [isOfflineVisible, setOfflineVisible] = useState(false);
  const [isRemoteEraseVisible, setRemoteEraseVisible] = useState(false);
  const [isMobilePaymentVisible, setMobilePaymentVisible] = useState(false);

  function startCaseGuide() {
    router.push("/case/new" as Href);
  }

  async function openCarrierReport() {
    try {
      await Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent("휴대폰 통신사 분실신고")}`);
      setCarrierReportVisible(false);
    } catch {
      Alert.alert("페이지를 열지 못했습니다", "가입한 통신사의 공식 고객센터에서 분실신고를 진행해주세요.");
    }
  }

  async function openNearbyPolice() {
    try {
      await Linking.openURL("https://www.google.com/maps/search/?api=1&query=%E4%BA%A4%E7%95%AA");
      setPoliceReportVisible(false);
    } catch {
      Alert.alert("지도를 열지 못했습니다", "지도 앱에서 '交番' 또는 '코반'을 검색해주세요.");
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right", "bottom"]} style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View accessibilityLabel="진행률 50퍼센트" style={styles.progressTrack}>
          <View style={styles.progressValue} />
        </View>

        <Text accessibilityRole="header" style={styles.title}>휴대전화 분실 긴급 행동 수칙</Text>

        <View accessibilityRole="alert" style={styles.warningCard}>
          <Ionicons color="#D7192D" name="warning" size={23} />
          <Text style={styles.warningText}>
            <Text style={styles.warningStrong}>중요 안내 최우선: </Text>
            기기 잠금과 통신사 분실신고를 먼저 진행하세요.
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
            <View style={styles.stepNumberActive}><Text style={styles.stepNumberActiveText}>1</Text></View>
            <View style={styles.urgentBadge}><Text style={styles.urgentBadgeText}>긴급</Text></View>
            <Text style={styles.primaryStepTitle}>기기 위치 확인 · 잠금</Text>
            <Ionicons color={colors.textSecondary} name="information-circle-outline" size={20} />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setDeviceLockVisible(true)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>내 휴대전화 찾기</Text>
            <Ionicons color={colors.background} name="arrow-forward" size={21} />
          </Pressable>
        </View>

        <StepRow icon="cellular" label="통신사 분실신고 · SIM 정지" number="2" onPress={() => setCarrierReportVisible(true)} />
        <StepRow icon="shield" label="현지 경찰에 분실·도난 신고" number="3" onPress={() => setPoliceReportVisible(true)} />
        <StepRow icon="documents-outline" label="계정 · 결제수단 보호" number="4" onPress={() => setAccountProtectionVisible(true)} trailing={<Text style={styles.aiBadge}>AI 맞춤</Text>} />

        <View style={styles.additionalCard}>
          <View style={styles.additionalTitleRow}>
            <Ionicons color={colors.primary} name="clipboard" size={23} />
            <Text style={styles.additionalTitle}>추가 안내</Text>
          </View>
          <GuideRow icon="power-outline" label="휴대전화가 꺼져 있다면?" onPress={() => setOfflineVisible(true)} />
          <GuideRow icon="settings" label="원격 초기화는 언제 하나요?" onPress={() => setRemoteEraseVisible(true)} />
          <GuideRow icon="card-outline" label="모바일 결제를 사용했다면?" onPress={() => setMobilePaymentVisible(true)} />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={startCaseGuide} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}>
          <Text style={styles.startButtonText}>휴대전화 분실로 가이드 시작하기</Text>
          <Ionicons color={colors.background} name="arrow-forward" size={22} />
        </Pressable>
      </View>

      <DeviceLockModal onClose={() => setDeviceLockVisible(false)} visible={isDeviceLockVisible} />
      <CarrierReportModal
        onClose={() => setCarrierReportVisible(false)}
        onOpenCarrierReport={() => void openCarrierReport()}
        visible={isCarrierReportVisible}
      />
      <PhonePoliceReportModal
        onClose={() => setPoliceReportVisible(false)}
        onFindPolice={() => void openNearbyPolice()}
        visible={isPoliceReportVisible}
      />
      <AccountProtectionModal
        onClose={() => setAccountProtectionVisible(false)}
        visible={isAccountProtectionVisible}
      />
      <OfflinePhoneModal onClose={() => setOfflineVisible(false)} visible={isOfflineVisible} />
      <RemoteEraseModal onClose={() => setRemoteEraseVisible(false)} visible={isRemoteEraseVisible} />
      <MobilePaymentModal onClose={() => setMobilePaymentVisible(false)} visible={isMobilePaymentVisible} />
    </SafeAreaView>
  );
}

function MobilePaymentModal({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const checks = ["Apple Pay / Google Wallet", "저장된 카드", "교통카드 기능", "카드사 분실신고 필요 여부"];

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable accessibilityLabel="모바일 결제 보호 안내 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>모바일 결제를 사용했다면?</Text>
            <Pressable accessibilityLabel="닫기" accessibilityRole="button" hitSlop={10} onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons color={colors.textSecondary} name="close" size={25} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.paymentIllustration}>
                <View style={styles.paymentBackdrop} />
                <Ionicons color="#245789" name="phone-portrait-outline" size={132} />
                <View style={styles.payBadge}>
                  <Ionicons color={colors.background} name="wifi" size={21} style={styles.payWave} />
                  <Text style={styles.payText}>Pay</Text>
                </View>
                <View style={styles.paymentCard}>
                  <Ionicons color="#AAB9CC" name="hardware-chip" size={21} />
                  <View style={styles.paymentDots}><Text style={styles.paymentDotsText}>••••</Text></View>
                  <View style={styles.cardCircles}>
                    <View style={styles.cardCircleLight} />
                    <View style={styles.cardCircleDark} />
                  </View>
                </View>
              </View>

              <View style={styles.modalCopy}>
                <Text style={styles.modalHeading}>등록된 결제수단을 확인하세요</Text>
                <Text style={styles.modalDescription}>
                  휴대전화에 등록된 모바일 결제 서비스와 저장된 카드를 확인하고, 필요하면 사용 중지 또는 카드사 분실신고를 진행해주세요.
                </Text>
              </View>

              <View style={styles.carrierChecklist}>
                <View style={styles.carrierChecklistTitleRow}>
                  <Ionicons color="#1268F5" name="clipboard" size={24} />
                  <Text style={styles.carrierChecklistTitle}>확인 항목</Text>
                </View>
                {checks.map((check) => (
                  <View key={check} style={styles.policeCheckRow}>
                    <Ionicons color="#1268F5" name="checkmark-circle" size={21} />
                    <Text style={styles.carrierCheckText}>{check}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.accountNotice}>
                <Ionicons color="#1268F5" name="information-circle-outline" size={22} />
                <Text style={styles.carrierNoticeText}>
                  모바일 결제와 함께 금융 앱, 간편결제, 저장된 카드 정보도 함께 점검하면 더 안전합니다.
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
            <Text style={styles.confirmButtonText}>확인했어요</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function RemoteEraseModal({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const checks = ["위치 추적이 계속 가능한지", "분실 모드 / 잠금 설정 여부", "백업 가능 여부", "정말 회수가 어려운 상황인지"];

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable accessibilityLabel="원격 초기화 안내 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>원격 초기화는 언제 하나요?</Text>
            <Pressable accessibilityLabel="닫기" accessibilityRole="button" hitSlop={10} onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons color={colors.textSecondary} name="close" size={25} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.eraseIllustration}>
                <View style={styles.eraseBackdrop} />
                <Ionicons color="#245789" name="phone-portrait-outline" size={130} />
                <Ionicons color="#1268F5" name="settings" size={47} style={styles.eraseSettings} />
                <Ionicons color="#1268F5" name="sync" size={39} style={styles.eraseSync} />
                <Ionicons color="#1268F5" name="shield" size={82} style={styles.eraseShield} />
                <Ionicons color={colors.background} name="lock-closed" size={32} style={styles.eraseLock} />
              </View>

              <View style={styles.offlineCopy}>
                <Text style={styles.modalHeading}>회수 가능성이 낮을 때 고려하세요</Text>
                <Text style={styles.modalDescription}>
                  회수 가능성이 낮고 개인정보 유출 위험이 큰 경우 원격 초기화를 고려할 수 있습니다.
                </Text>
              </View>

              <View style={styles.carrierChecklist}>
                <View style={styles.carrierChecklistTitleRow}>
                  <Ionicons color="#1268F5" name="clipboard" size={24} />
                  <Text style={styles.carrierChecklistTitle}>초기화 전 확인</Text>
                </View>
                {checks.map((check) => (
                  <View key={check} style={styles.policeCheckRow}>
                    <Ionicons color="#1268F5" name="checkmark-circle" size={21} />
                    <Text style={styles.carrierCheckText}>{check}</Text>
                  </View>
                ))}
              </View>

              <View accessibilityRole="alert" style={styles.eraseWarning}>
                <Ionicons color="#D7192D" name="warning" size={27} />
                <Text style={styles.eraseWarningText}>
                  원격 초기화 후에는 위치 추적이나 원격 제어가 제한될 수 있으므로 신중하게 진행해주세요.
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
            <Text style={styles.confirmButtonText}>확인했어요</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function OfflinePhoneModal({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const checks = [
    { icon: "location" as const, label: "마지막 위치 확인" },
    { icon: "cellular" as const, label: "오프라인 상태 여부 확인" },
    { icon: "notifications" as const, label: "다시 켜질 때 알림 설정" },
  ];

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable accessibilityLabel="꺼진 휴대전화 안내 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>휴대전화가 꺼져 있다면?</Text>
            <Pressable accessibilityLabel="닫기" accessibilityRole="button" hitSlop={10} onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons color={colors.textSecondary} name="close" size={25} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.offlineIllustration}>
                <View style={styles.offlineBackdrop} />
                <View style={styles.offlinePhone}>
                  <View style={styles.offlineSpeaker} />
                  <Ionicons color="#B8C3D2" name="power" size={45} />
                </View>
                <View style={styles.offlineBadge}>
                  <Ionicons color="#1268F5" name="cellular" size={34} />
                  <View style={styles.offlineSlash} />
                </View>
              </View>

              <View style={styles.offlineCopy}>
                <Text style={styles.modalHeading}>마지막으로 확인된 위치를 보세요</Text>
                <Text style={styles.modalDescription}>
                  휴대전화 전원이 꺼져 있거나 오프라인 상태라면 마지막으로 확인된 위치를 먼저 확인하고, 다시 온라인 상태가 될 때 알림을 받을 수 있도록 설정해주세요.
                </Text>
              </View>

              <View style={styles.offlineChecklist}>
                {checks.map((check) => (
                  <View key={check.label} style={styles.offlineCheckRow}>
                    <View style={styles.offlineCheckIcon}><Ionicons color="#1268F5" name={check.icon} size={22} /></View>
                    <Text style={styles.offlineCheckText}>{check.label}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.offlineWarning}>
                <Ionicons color="#395A8D" name="shield" size={27} />
                <View style={styles.offlineWarningDivider} />
                <Text style={styles.offlineWarningText}>
                  휴대전화를 직접 회수하러 가기보다 필요 시 현지 경찰의 도움을 받는 것이 안전합니다.
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
            <Text style={styles.confirmButtonText}>확인했어요</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AccountProtectionModal({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  const accounts = ["이메일", "Apple / Google 계정", "카카오톡 등 메신저", "인터넷뱅킹 · 증권 앱", "SNS", "Apple Pay / Google Wallet"];

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable accessibilityLabel="계정 및 결제수단 보호 안내 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>4. 계정 · 결제수단 보호</Text>
            <Pressable accessibilityLabel="닫기" accessibilityRole="button" hitSlop={10} onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons color={colors.textSecondary} name="close" size={25} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.accountIllustration}>
                <View style={styles.accountBackdrop} />
                <Ionicons color="#245789" name="phone-portrait-outline" size={124} />
                <Ionicons color="#1268F5" name="shield-checkmark" size={68} style={styles.accountShield} />
                <View style={[styles.accountBadge, styles.mailBadge]}><Ionicons color="#E3382B" name="mail" size={26} /></View>
                <View style={[styles.accountBadge, styles.googleBadge]}><Ionicons color="#4285F4" name="logo-google" size={26} /></View>
                <View style={[styles.accountBadge, styles.chatBadge]}><Ionicons color="#3A2700" name="chatbubble" size={26} /></View>
                <View style={[styles.accountBadge, styles.appleBadge]}><Ionicons color="#111827" name="logo-apple" size={26} /></View>
                <View style={[styles.accountBadge, styles.cardBadge]}><Ionicons color="#E7F0FF" name="card" size={31} /></View>
              </View>

              <View style={styles.modalCopy}>
                <Text style={styles.modalHeading}>주요 계정과 결제수단을 보호하세요</Text>
                <Text style={styles.modalDescription}>
                  분실한 휴대전화에 로그인되어 있던 계정과 모바일 결제 서비스를 확인하고 필요한 조치를 진행해주세요.
                </Text>
              </View>

              <View style={styles.carrierChecklist}>
                <View style={styles.carrierChecklistTitleRow}>
                  <Ionicons color="#1268F5" name="clipboard" size={24} />
                  <Text style={styles.carrierChecklistTitle}>우선 확인할 것</Text>
                </View>
                {accounts.map((account) => (
                  <View key={account} style={styles.carrierCheckRow}>
                    <Text style={styles.carrierBullet}>•</Text>
                    <Text style={styles.carrierCheckText}>{account}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.accountNotice}>
                <Ionicons color="#1268F5" name="information-circle-outline" size={22} />
                <Text style={styles.carrierNoticeText}>
                  이메일 계정은 다른 서비스 비밀번호 재설정의 시작점이 될 수 있으므로 우선적으로 보호해주세요.
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
            <Text style={styles.confirmButtonText}>확인했어요</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function PhonePoliceReportModal({ onClose, onFindPolice, visible }: { onClose: () => void; onFindPolice: () => void; visible: boolean }) {
  const reportItems = ["분실 / 도난 상황 설명", "마지막 확인 위치 전달", "신고 접수증 또는 사건번호 수령"];

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable accessibilityLabel="현지 경찰 신고 안내 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>3. 현지 경찰에 분실·도난 신고</Text>
            <Pressable accessibilityLabel="닫기" accessibilityRole="button" hitSlop={10} onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons color={colors.textSecondary} name="close" size={25} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.policeIllustration}>
                <View style={styles.policeBackdrop} />
                <Ionicons color="#86BDEE" name="business" size={116} />
                <View style={styles.policeSign}>
                  <Ionicons color="#F3D42F" name="shield" size={23} />
                  <Text style={styles.policeSignText}>POLICE</Text>
                </View>
                <View style={styles.policePost}><Text style={styles.policePostText}>경찰서</Text></View>
              </View>

              <View style={styles.policeCopy}>
                <Text style={styles.modalHeading}>가까운 경찰서에서 신고하세요</Text>
                <Text style={styles.modalDescription}>
                  분실 또는 도난 상황과 장소를 설명하고, 신고 접수증이나 사건번호를 받아주세요.
                </Text>
              </View>

              <View style={styles.carrierChecklist}>
                <View style={styles.carrierChecklistTitleRow}>
                  <Ionicons color="#1268F5" name="clipboard" size={24} />
                  <Text style={styles.carrierChecklistTitle}>신고 시 핵심</Text>
                </View>
                {reportItems.map((item) => (
                  <View key={item} style={styles.policeCheckRow}>
                    <Ionicons color="#1268F5" name="checkmark-circle" size={21} />
                    <Text style={styles.carrierCheckText}>{item}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.japaneseCard}>
                <View style={styles.carrierChecklistTitleRow}>
                  <Ionicons color="#1268F5" name="chatbox" size={23} />
                  <Text style={styles.carrierChecklistTitle}>경찰관에게 보여주세요</Text>
                </View>
                <View style={styles.japanesePhraseBox}>
                  <Text lang="ja" style={styles.japanesePhrase}>スマートフォンを紛失しました。{"\n"}遺失届を出したいです。</Text>
                  <View style={styles.japaneseDivider} />
                  <Text style={styles.japaneseTranslation}>휴대전화를 분실했습니다. 분실 신고를 하고 싶습니다.</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={onFindPolice} style={({ pressed }) => [styles.confirmButton, styles.carrierButton, pressed && styles.pressed]}>
            <Text style={styles.confirmButtonText}>가까운 경찰서 찾기</Text>
            <Ionicons color={colors.background} name="arrow-forward" size={20} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function CarrierReportModal({ onClose, onOpenCarrierReport, visible }: { onClose: () => void; onOpenCarrierReport: () => void; visible: boolean }) {
  const checks = ["SIM / eSIM 일시 정지", "해외 로밍 정지", "단말기 분실 등록", "IMEI 차단 가능 여부 확인"];

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable accessibilityLabel="통신사 분실신고 안내 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>2. 통신사 분실신고 · SIM 정지</Text>
            <Pressable accessibilityLabel="닫기" accessibilityRole="button" hitSlop={10} onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons color={colors.textSecondary} name="close" size={25} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.carrierIllustration}>
                <View style={styles.carrierBackdrop} />
                <Ionicons color="#2F568B" name="phone-portrait-outline" size={125} />
                <Ionicons color="#1268F5" name="cellular" size={45} style={styles.carrierSignal} />
                <Ionicons color="#EF4444" name="ban" size={52} style={styles.phoneBan} />
                <View style={styles.simCard}>
                  <Ionicons color="#F4B731" name="card" size={31} />
                  <Ionicons color="#EF4444" name="ban" size={35} style={styles.simBan} />
                </View>
              </View>

              <View style={styles.modalCopy}>
                <Text style={styles.modalHeading}>통신사에 먼저 분실신고하세요</Text>
                <Text style={styles.modalDescription}>
                  휴대전화의 SIM 또는 eSIM을 정지하여 타인이 전화, 문자, 인증번호를 사용하는 것을 빠르게 막아주세요.
                </Text>
              </View>

              <View style={styles.carrierChecklist}>
                <View style={styles.carrierChecklistTitleRow}>
                  <Ionicons color="#1268F5" name="clipboard" size={24} />
                  <Text style={styles.carrierChecklistTitle}>확인할 항목</Text>
                </View>
                {checks.map((check) => (
                  <View key={check} style={styles.carrierCheckRow}>
                    <Text style={styles.carrierBullet}>•</Text>
                    <Text style={styles.carrierCheckText}>{check}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.carrierNotice}>
                <Ionicons color="#7890B5" name="information-circle-outline" size={22} />
                <Text style={styles.carrierNoticeText}>
                  문자 인증을 통한 계정 탈취를 막기 위해 가능한 한 빠르게 진행하는 것이 중요합니다.
                </Text>
              </View>
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={onOpenCarrierReport} style={({ pressed }) => [styles.confirmButton, styles.carrierButton, pressed && styles.pressed]}>
            <Text style={styles.confirmButtonText}>통신사 분실신고 보기</Text>
            <Ionicons color={colors.background} name="arrow-forward" size={20} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function DeviceLockModal({ onClose, visible }: { onClose: () => void; visible: boolean }) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
      <View style={styles.modalOverlay}>
        <Pressable accessibilityLabel="기기 위치 확인 안내 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />

        <View accessibilityViewIsModal style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text accessibilityRole="header" style={styles.modalTitle}>1. 기기 위치 확인 · 잠금</Text>
            <Pressable accessibilityLabel="닫기" accessibilityRole="button" hitSlop={10} onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons color={colors.textSecondary} name="close" size={25} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalBody}>
              <View style={styles.deviceIllustration}>
                <Ionicons color="#2F568B" name="phone-portrait-outline" size={130} />
                <Ionicons color="#1570EF" name="location" size={55} style={styles.deviceLocation} />
                <View style={styles.deviceLock}>
                  <Ionicons color={colors.background} name="lock-closed" size={35} />
                </View>
              </View>

              <View style={styles.modalCopy}>
                <Text style={styles.modalHeading}>다른 기기에서 위치를 확인하세요</Text>
                <Text style={styles.modalDescription}>
                  Apple의 나의 찾기 또는 Android의 내 기기 찾기를 통해 분실한 휴대전화의 위치를 확인하고, 분실 모드 또는 기기 잠금을 설정해주세요.
                </Text>
              </View>

              <View style={styles.lockGuideCard}>
                <LockGuideItem description="다른 Apple 기기나 웹에서 위치를 확인할 수 있어요." icon="logo-apple" title="Apple '나의 찾기'" />
                <LockGuideItem description="Google 계정으로 기기의 위치를 확인할 수 있어요." icon="logo-android" title="Android '내 기기 찾기'" />
                <LockGuideItem description="기기를 잠그고 개인정보를 안전하게 보호하세요." icon="lock-closed" title="분실 모드 / 기기 잠금 설정" />
                <LockGuideItem description="습득자가 연락할 수 있는 전화번호와 메시지를 보여줄 수 있어요." icon="chatbox" title="연락 가능한 번호 · 메시지 표시" />
              </View>

              <View accessibilityRole="alert" style={styles.lockWarning}>
                <Ionicons color="#D7192D" name="warning" size={25} />
                <View style={styles.lockWarningCopy}>
                  <Text style={styles.lockWarningTitle}>주의해주세요</Text>
                  <Text style={styles.lockWarningText}>
                    기기를 바로 초기화하면 위치 추적이 어려워질 수 있어요. 회수 가능성을 먼저 확인한 뒤 신중하게 진행해주세요.
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}>
            <Text style={styles.confirmButtonText}>확인했어요</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function LockGuideItem({ description, icon, title }: { description: string; icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <View style={styles.lockGuideItem}>
      <View style={styles.lockGuideIcon}><Ionicons color="#1268F5" name={icon} size={22} /></View>
      <View style={styles.lockGuideCopy}>
        <Text style={styles.lockGuideTitle}>{title}</Text>
        <Text style={styles.lockGuideDescription}>{description}</Text>
      </View>
    </View>
  );
}

function StepRow({ icon, label, number, onPress, trailing }: { icon: keyof typeof Ionicons.glyphMap; label: string; number: string; onPress: () => void; trailing?: React.ReactNode }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.stepRow, pressed && styles.pressed]}>
      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
      <Ionicons color="#4568A6" name={icon} size={21} />
      <Text style={styles.stepLabel}>{label}</Text>
      {trailing}
      <Ionicons color="#6B82A8" name="chevron-forward" size={19} />
    </Pressable>
  );
}

function GuideRow({ icon, label, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.guideRow, pressed && styles.pressed]}>
      <Ionicons color={colors.primary} name={icon} size={23} />
      <Text style={styles.guideLabel}>{label}</Text>
      <Ionicons color={colors.primary} name="chevron-forward" size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F7F9FD" },
  content: { width: "100%", maxWidth: 520, alignSelf: "center", gap: 10, paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  progressTrack: { height: 6, marginTop: spacing.sm, borderRadius: 3, backgroundColor: "#DFE6F7", overflow: "hidden" },
  progressValue: { width: "49%", height: "100%", borderRadius: 3, backgroundColor: "#1473F6" },
  title: { marginTop: 4, color: colors.text, fontSize: 24, lineHeight: 31, fontWeight: "900" },
  warningCard: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#FFBDB8", borderRadius: radius.md, backgroundColor: "#FFE1DF" },
  warningText: { flex: 1, color: "#D7192D", fontSize: 12, lineHeight: 18, fontWeight: "700" },
  warningStrong: { fontWeight: "900" },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.sm, marginTop: 2 },
  sectionTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: "900" },
  sectionAccent: { color: colors.primary },
  duration: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  primaryStep: { gap: 13, padding: 10, borderWidth: 2, borderColor: "#79A9FF", borderRadius: radius.md, backgroundColor: colors.background },
  stepHeading: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepNumberActive: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#075BE8" },
  stepNumberActiveText: { color: colors.background, fontSize: 14, fontWeight: "900" },
  urgentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: "#C90017" },
  urgentBadgeText: { color: colors.background, fontSize: 11, fontWeight: "900" },
  primaryStepTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: "900" },
  primaryButton: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.sm, backgroundColor: "#075BE8" },
  primaryButtonText: { color: colors.background, fontSize: 14, fontWeight: "900" },
  stepRow: { minHeight: 49, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: "#DEE5F0", borderRadius: radius.md, backgroundColor: colors.background },
  stepNumber: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "#EAF1FF" },
  stepNumberText: { color: "#3D5F9A", fontSize: 13, fontWeight: "900" },
  stepLabel: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "800" },
  aiBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, color: "#315C9E", backgroundColor: "#E3ECFF", fontSize: 9, fontWeight: "900", overflow: "hidden" },
  additionalCard: { gap: 7, padding: 10, borderWidth: 1, borderColor: "#DCE5F3", borderRadius: radius.md, backgroundColor: colors.background },
  additionalTitleRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 2 },
  additionalTitle: { color: colors.primary, fontSize: 18, fontWeight: "900" },
  guideRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: "#F1F5FF" },
  guideLabel: { flex: 1, color: colors.text, fontSize: 12, fontWeight: "800" },
  footer: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md, borderTopWidth: 1, borderTopColor: "#E4E8F1", backgroundColor: colors.background },
  startButton: { width: "100%", maxWidth: 488, minHeight: 55, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderRadius: radius.md, backgroundColor: "#1463F3" },
  startButtonText: { color: colors.background, fontSize: 14, fontWeight: "900" },
  pressed: { opacity: 0.72 },
  modalOverlay: { flex: 1, alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "rgba(15, 23, 42, 0.18)" },
  modalCard: { width: "100%", maxWidth: 430, maxHeight: "94%", gap: 11, padding: 14, borderRadius: 18, backgroundColor: colors.background, shadowColor: "#7A91B8", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 18, elevation: 8 },
  modalHeader: { minHeight: 38, flexDirection: "row", alignItems: "center", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#DCE2EE" },
  modalTitle: { flex: 1, color: colors.text, fontSize: 17, fontWeight: "900" },
  modalCloseButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  modalBody: { gap: 12, paddingBottom: 2 },
  deviceIllustration: { height: 145, alignItems: "center", justifyContent: "center" },
  deviceLocation: { position: "absolute", marginTop: -18 },
  deviceLock: { position: "absolute", width: 62, height: 62, alignItems: "center", justifyContent: "center", marginLeft: 93, marginTop: 72, borderRadius: 14, backgroundColor: "#086AF0", shadowColor: "#4C78A8", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 3 },
  modalCopy: { gap: 5 },
  modalHeading: { color: colors.text, fontSize: 19, lineHeight: 26, fontWeight: "900" },
  modalDescription: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  lockGuideCard: { gap: 10, padding: 12, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  lockGuideItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  lockGuideIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#E2ECFF" },
  lockGuideCopy: { flex: 1, gap: 1 },
  lockGuideTitle: { color: colors.text, fontSize: 12, fontWeight: "900" },
  lockGuideDescription: { color: colors.textSecondary, fontSize: 9, lineHeight: 14 },
  lockWarning: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12, borderWidth: 1, borderColor: "#FFC9C9", borderRadius: radius.md, backgroundColor: "#FFECEC" },
  lockWarningCopy: { flex: 1, gap: 3 },
  lockWarningTitle: { color: "#D7192D", fontSize: 12, fontWeight: "900" },
  lockWarningText: { color: colors.textSecondary, fontSize: 9, lineHeight: 14 },
  confirmButton: { minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: "#1268F5", shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  confirmButtonText: { color: colors.background, fontSize: 14, fontWeight: "900" },
  carrierIllustration: { height: 150, alignItems: "center", justifyContent: "center" },
  carrierBackdrop: { position: "absolute", width: 156, height: 132, borderTopLeftRadius: 78, borderTopRightRadius: 78, backgroundColor: "#ECF5FF" },
  carrierSignal: { position: "absolute", marginLeft: -18, marginTop: -15 },
  phoneBan: { position: "absolute", marginLeft: -15, marginTop: 54 },
  simCard: { position: "absolute", width: 58, height: 76, alignItems: "center", justifyContent: "center", marginLeft: 118, marginTop: 24, borderRadius: 11, backgroundColor: "#9EC6FF" },
  simBan: { position: "absolute", marginLeft: 30, marginTop: 45 },
  carrierChecklist: { gap: 7, padding: 13, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  carrierChecklistTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  carrierChecklistTitle: { color: "#1268F5", fontSize: 15, fontWeight: "900" },
  carrierCheckRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  carrierBullet: { color: "#1268F5", fontSize: 19, lineHeight: 18, fontWeight: "900" },
  carrierCheckText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  carrierNotice: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  carrierNoticeText: { flex: 1, color: colors.textSecondary, fontSize: 10, lineHeight: 16 },
  carrierButton: { flexDirection: "row", gap: 8 },
  policeIllustration: { height: 144, alignItems: "center", justifyContent: "flex-end" },
  policeBackdrop: { position: "absolute", bottom: 0, width: 210, height: 126, borderTopLeftRadius: 105, borderTopRightRadius: 105, backgroundColor: "#ECF5FF" },
  policeSign: { position: "absolute", bottom: 73, minWidth: 89, alignItems: "center", justifyContent: "center", paddingVertical: 5, borderRadius: 2, backgroundColor: "#2259B5" },
  policeSignText: { color: colors.background, fontSize: 10, fontWeight: "900" },
  policePost: { position: "absolute", right: 55, bottom: 0, width: 27, height: 69, alignItems: "center", justifyContent: "center", borderRadius: 3, backgroundColor: "#3268B8" },
  policePostText: { color: colors.background, fontSize: 9, lineHeight: 13, fontWeight: "900" },
  policeCopy: { alignItems: "center", gap: 5 },
  policeCheckRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  japaneseCard: { gap: 9, padding: 12, borderWidth: 1, borderColor: "#D5E3FA", borderRadius: radius.md, backgroundColor: "#F4F7FF" },
  japanesePhraseBox: { gap: 7, padding: 11, borderWidth: 1, borderColor: "#E1E6EF", borderRadius: radius.sm, backgroundColor: colors.background },
  japanesePhrase: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: "900" },
  japaneseDivider: { height: 1, backgroundColor: "#E5EAF2" },
  japaneseTranslation: { color: colors.textSecondary, fontSize: 10, lineHeight: 15 },
  accountIllustration: { height: 153, alignItems: "center", justifyContent: "center" },
  accountBackdrop: { position: "absolute", width: 240, height: 120, borderRadius: 60, backgroundColor: "#EFF6FF" },
  accountShield: { position: "absolute", marginTop: 25 },
  accountBadge: { position: "absolute", width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: colors.background, shadowColor: "#7890B5", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.17, shadowRadius: 5, elevation: 3 },
  mailBadge: { marginLeft: -142, marginTop: -68, transform: [{ rotate: "-8deg" }] },
  googleBadge: { marginLeft: -163, marginTop: 13 },
  chatBadge: { marginLeft: -122, marginTop: 89, backgroundColor: "#F5D30B", transform: [{ rotate: "-8deg" }] },
  appleBadge: { marginLeft: 145, marginTop: 34 },
  cardBadge: { width: 68, marginLeft: 134, marginTop: -66, backgroundColor: "#1268F5", transform: [{ rotate: "-7deg" }] },
  accountNotice: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 12, borderWidth: 1, borderColor: "#CFE0FA", borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  offlineIllustration: { height: 150, alignItems: "center", justifyContent: "center" },
  offlineBackdrop: { position: "absolute", width: 150, height: 126, borderRadius: 75, backgroundColor: "#EEF5FF" },
  offlinePhone: { width: 72, height: 125, alignItems: "center", justifyContent: "center", borderWidth: 6, borderColor: "#536173", borderRadius: 14, backgroundColor: "#1D2734" },
  offlineSpeaker: { position: "absolute", top: 8, width: 25, height: 3, borderRadius: 2, backgroundColor: "#8390A0" },
  offlineBadge: { position: "absolute", width: 59, height: 59, alignItems: "center", justifyContent: "center", marginLeft: 91, marginTop: 73, borderWidth: 4, borderColor: colors.background, borderRadius: 30, backgroundColor: "#D9E9FF" },
  offlineSlash: { position: "absolute", width: 4, height: 40, borderRadius: 2, backgroundColor: "#1268F5", transform: [{ rotate: "-42deg" }] },
  offlineCopy: { alignItems: "center", gap: 7 },
  offlineChecklist: { gap: 9, padding: 12, borderRadius: radius.md, backgroundColor: "#F1F5FF" },
  offlineCheckRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  offlineCheckIcon: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: colors.background },
  offlineCheckText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: "900" },
  offlineWarning: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderWidth: 1, borderColor: "#D5E1F1", borderRadius: radius.md, backgroundColor: "#F7F9FD" },
  offlineWarningDivider: { width: 1, alignSelf: "stretch", backgroundColor: "#D5E1F1" },
  offlineWarningText: { flex: 1, color: colors.textSecondary, fontSize: 10, lineHeight: 16 },
  eraseIllustration: { height: 156, alignItems: "center", justifyContent: "center" },
  eraseBackdrop: { position: "absolute", width: 160, height: 142, borderRadius: 80, backgroundColor: "#EEF5FF" },
  eraseSettings: { position: "absolute", marginLeft: -20, marginTop: -47 },
  eraseSync: { position: "absolute", marginLeft: -20, marginTop: 47 },
  eraseShield: { position: "absolute", marginLeft: 94, marginTop: 48 },
  eraseLock: { position: "absolute", marginLeft: 94, marginTop: 54 },
  eraseWarning: { flexDirection: "row", alignItems: "center", gap: 11, padding: 12, borderWidth: 1, borderColor: "#FFC9C9", borderRadius: radius.md, backgroundColor: "#FFECEC" },
  eraseWarningText: { flex: 1, color: "#D7192D", fontSize: 10, lineHeight: 16, fontWeight: "800" },
  paymentIllustration: { height: 154, alignItems: "center", justifyContent: "center" },
  paymentBackdrop: { position: "absolute", width: 164, height: 132, borderRadius: 82, backgroundColor: "#EEF5FF" },
  payBadge: { position: "absolute", width: 72, height: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: -38, borderRadius: 6, backgroundColor: "#1570EF" },
  payWave: { transform: [{ rotate: "90deg" }] },
  payText: { color: colors.background, fontSize: 15, fontWeight: "900" },
  paymentCard: { position: "absolute", width: 120, height: 67, marginLeft: 86, marginTop: 67, padding: 10, borderWidth: 1, borderColor: "#AFCBFA", borderRadius: 8, backgroundColor: colors.background, transform: [{ rotate: "-4deg" }] },
  paymentDots: { position: "absolute", left: 42, top: 29 },
  paymentDotsText: { color: "#AAB9CC", fontSize: 15, letterSpacing: 3 },
  cardCircles: { position: "absolute", right: 10, bottom: 10, flexDirection: "row" },
  cardCircleLight: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#79AEFF" },
  cardCircleDark: { width: 18, height: 18, marginLeft: -7, borderRadius: 9, backgroundColor: "#3478F6" },
});
