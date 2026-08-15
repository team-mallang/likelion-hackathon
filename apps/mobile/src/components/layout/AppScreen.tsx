import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { colors, spacing } from "@/theme/tokens";

type AppScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
  footerScrollable?: boolean;
  scroll?: boolean;
};

export function AppScreen({
  children,
  footer,
  footerScrollable = false,
  scroll = true,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(spacing.md, insets.bottom + spacing.sm);
  const fixedFooter = footer && !footerScrollable ? footer : null;
  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[
        styles.content,
        !fixedFooter && !footerScrollable && { paddingBottom: bottomPadding },
      ]}
      keyboardDismissMode="none"
      keyboardShouldPersistTaps="always"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
    >
      {children}
      {footer && footerScrollable ? (
        <View style={[styles.scrollableFooter, { paddingBottom: bottomPadding }]}>
          {footer}
        </View>
      ) : null}
    </ScrollView>
  ) : (
    <View
      style={[
        styles.content,
        !footer && { paddingBottom: bottomPadding },
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardArea}
      >
        {content}

        {fixedFooter ? (
          <View style={[styles.footer, { paddingBottom: bottomPadding }]}>
            {fixedFooter}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  scrollableFooter: {
    paddingTop: spacing.lg,
  },
});
