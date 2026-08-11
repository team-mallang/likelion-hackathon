import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { InterpreterTurn } from "@/features/police-support/types/policeSupport";
import { colors, radius, spacing } from "@/theme/tokens";

type InterpreterConversationProps = {
  turns: InterpreterTurn[];
  isTranscribing: boolean;
  isTranslating: boolean;
  onRetryTranslation: (turnId: string) => void;
};

export function InterpreterConversation({
  turns,
  isTranscribing,
  isTranslating,
  onRetryTranslation,
}: InterpreterConversationProps) {
  if (turns.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          accessibilityElementsHidden
          color={colors.primary}
          name="chatbubbles-outline"
          size={28}
        />
        <Text style={styles.emptyTitle}>통역 대화를 시작해 보세요</Text>
        <Text style={styles.emptyDescription}>
          아래에서 말하는 사람을 선택한 뒤 마이크를 눌러 주세요.
        </Text>
      </View>
    );
  }

  return (
    <View accessibilityLabel="여행자와 경찰관의 통역 대화" style={styles.list}>
      {turns.map((turn, index) => (
        <ConversationBubble
          isLatest={index === turns.length - 1}
          isTranscribing={isTranscribing}
          isTranslating={isTranslating}
          key={turn.id}
          onRetryTranslation={onRetryTranslation}
          turn={turn}
        />
      ))}
      <FinalTranslationAnnouncement turn={turns[turns.length - 1]} />
    </View>
  );
}

function FinalTranslationAnnouncement({
  turn,
}: {
  turn: InterpreterTurn | undefined;
}) {
  if (!turn || turn.status !== "FINAL") {
    return null;
  }

  return (
    <Text accessibilityLiveRegion="polite" style={styles.finalAnnouncement}>
      {turn.speakerRole === "TRAVELER" ? "여행자" : "경찰관"} 발화의
      번역이 완료되었습니다.
    </Text>
  );
}

type ConversationBubbleProps = {
  turn: InterpreterTurn;
  isLatest: boolean;
  isTranscribing: boolean;
  isTranslating: boolean;
  onRetryTranslation: (turnId: string) => void;
};

function ConversationBubble({
  turn,
  isLatest,
  isTranscribing,
  isTranslating,
  onRetryTranslation,
}: ConversationBubbleProps) {
  const isTraveler = turn.speakerRole === "TRAVELER";
  const originalLanguage = turn.sourceLanguage === "ja-JP" ? "ja" : "ko";
  const translationLanguage = turn.targetLanguage === "ja-JP" ? "ja" : "ko";
  const transcriptionFailed = turn.status === "TRANSCRIPTION_FAILED";
  const translationFailed = turn.status === "TRANSLATION_FAILED";

  const originalText = transcriptionFailed
    ? turn.errorMessage ?? "음성을 문자로 변환하지 못했습니다."
    : turn.originalText ||
      (isLatest && isTranscribing ? "듣고 있습니다…" : "음성을 확인 중입니다…");

  const translationText = translationFailed
    ? turn.errorMessage ?? "번역하지 못했습니다."
    : turn.translatedText ||
      (isLatest && isTranslating ? "번역 중…" : "번역을 기다리고 있습니다…");

  return (
    <View
      accessibilityLabel={`${isTraveler ? "여행자" : "경찰관"} 발화`}
      style={[
        styles.bubbleRow,
        isTraveler ? styles.travelerRow : styles.officerRow,
      ]}
    >
      {!isTraveler ? (
        <View style={styles.officerIcon}>
          <Ionicons
            accessibilityElementsHidden
            color={colors.textSecondary}
            name="shield-checkmark-outline"
            size={18}
          />
        </View>
      ) : null}

      <View
        style={[
          styles.bubble,
          isTraveler ? styles.travelerBubble : styles.officerBubble,
        ]}
      >
        <Text
          accessibilityLanguage={originalLanguage}
          style={[
            styles.originalText,
            isTraveler && styles.travelerOriginalText,
            transcriptionFailed && styles.failedText,
          ]}
        >
          {originalText}
        </Text>
        <View
          style={[
            styles.bubbleDivider,
            isTraveler && styles.travelerDivider,
          ]}
        />
        <Text
          accessibilityLanguage={translationLanguage}
          style={[
            styles.translationText,
            isTraveler && styles.travelerTranslationText,
            translationFailed && styles.failedText,
          ]}
        >
          {translationText}
        </Text>

        {translationFailed ? (
          <Pressable
            accessibilityLabel="이 발화 번역 다시 시도"
            accessibilityRole="button"
            onPress={() => onRetryTranslation(turn.turnId)}
            style={styles.retryButton}
          >
            <Ionicons
              accessibilityElementsHidden
              color={isTraveler ? colors.background : colors.primary}
              name="refresh-outline"
              size={16}
            />
            <Text
              style={[
                styles.retryText,
                isTraveler && styles.travelerRetryText,
              ]}
            >
              번역 다시 시도
            </Text>
          </Pressable>
        ) : null}

        {turn.status === "PARTIAL" && !transcriptionFailed ? (
          <Text
            style={[
              styles.partialLabel,
              isTraveler && styles.travelerPartialLabel,
            ]}
          >
            실시간 변환 중
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.md,
  },
  emptyState: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  finalAnnouncement: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  bubbleRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
  },
  travelerRow: {
    justifyContent: "flex-end",
  },
  officerRow: {
    justifyContent: "flex-start",
  },
  officerIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.background,
  },
  bubble: {
    maxWidth: "82%",
    gap: spacing.sm,
    padding: spacing.md,
  },
  travelerBubble: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    backgroundColor: colors.primary,
  },
  officerBubble: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  originalText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 25,
  },
  travelerOriginalText: {
    color: colors.background,
  },
  bubbleDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  travelerDivider: {
    backgroundColor: "rgba(255,255,255,0.32)",
  },
  translationText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  travelerTranslationText: {
    color: colors.background,
  },
  failedText: {
    color: colors.error,
  },
  retryButton: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    cursor: "pointer",
  },
  retryText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  travelerRetryText: {
    color: colors.background,
  },
  partialLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
  },
  travelerPartialLabel: {
    color: colors.background,
  },
});
