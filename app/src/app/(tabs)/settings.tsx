import { router } from 'expo-router';
import { useState } from 'react';
import { ActionSheetIOS, Alert, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { AppText, DevSection, Screen, SettingsRow, SettingsSection } from '@/components';
import { strings, type LanguagePreference } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { draftFromProfile } from '@/lib/onboarding';
import { exportLogCsv } from '@/services/exportCsv';
import { useLogStore } from '@/stores/log';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProfileStore } from '@/stores/profile';
import { useSettingsStore } from '@/stores/settings';
import { colors, decor, layout, radius, size } from '@/theme';

const t = strings.settings;
const LANGUAGES: readonly LanguagePreference[] = ['system', 'ro', 'en'];
const SUPPORT_MAIL = 'mailto:musteatamihai2002@icloud.com?subject=Platewise';

/**
 * Settings (Settings.html): goal and target (edited on the onboarding screens), tracking
 * toggles, CSV export, delete all data, help links.
 */
export default function SettingsScreen() {
  const profile = useProfileStore((s) => s.profile);
  const updateProfile = useProfileStore((s) => s.updateProfile);
  const [exporting, setExporting] = useState(false);
  const [devVisible, setDevVisible] = useState(false);
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  /** Opens an onboarding step in edit mode, prefilled from the saved profile. */
  const edit = (pathname: '/onboarding/goal' | '/onboarding/target') => {
    if (!profile) return;
    useOnboardingStore.getState().load(draftFromProfile(profile));
    router.push({ pathname, params: { edit: '1' } });
  };

  const exportCsv = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const result = await exportLogCsv();
      if (result === 'empty') Alert.alert(t.exportEmptyTitle, t.exportEmptyBody);
    } catch {
      Alert.alert(t.exportErrorTitle, t.exportErrorBody);
    } finally {
      setExporting(false);
    }
  };

  const deleteAll = () =>
    Alert.alert(t.deleteTitle, t.deleteBody, [
      { text: strings.common.cancel, style: 'cancel' },
      {
        text: t.deleteConfirm,
        style: 'destructive',
        onPress: async () => {
          // Wipes the log and custom/OFF foods. The scan counter (Keychain) stays on purpose.
          await useLogStore.getState().clearAll();
          useOnboardingStore.getState().reset();
          useProfileStore.getState().reset();
          router.replace('/onboarding/about');
        },
      },
    ]);

  /** Native sheet: Automat / Română / English. Choosing one re-mounts the app in that language. */
  const chooseLanguage = () => {
    const labels = LANGUAGES.map((l) => t.languageOptions[l]);
    const pick = (index: number) => {
      const choice = LANGUAGES[index];
      if (choice && choice !== language) setLanguage(choice);
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: t.language,
          message: t.languageSheetMessage,
          options: [...labels, strings.common.cancel],
          cancelButtonIndex: labels.length,
        },
        pick,
      );
    } else {
      Alert.alert(t.language, t.languageSheetMessage, [
        ...labels.map((text, i) => ({ text, onPress: () => pick(i) })),
        { text: strings.common.cancel, style: 'cancel' as const },
      ]);
    }
  };

  const support = () =>
    Alert.alert(t.support, t.supportBody, [
      { text: t.supportEmail, onPress: () => void Linking.openURL(SUPPORT_MAIL) },
      { text: strings.common.close, style: 'cancel' },
    ]);

  return (
    <Screen scroll bottomInset={false} gap={layout.sectionGap}>
      <View style={styles.blob} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />

      <View style={styles.header}>
        {/* Long-press (1,5 s) toggles the hidden dev section. */}
        <Pressable
          delayLongPress={1500}
          onLongPress={() => setDevVisible((v) => !v)}
          testID="settings-title"
        >
          <AppText variant="h1" accessibilityRole="header">
            {t.title}
          </AppText>
        </Pressable>
      </View>

      <SettingsSection title={t.sections.goals}>
        <SettingsRow
          testID="settings-target"
          divider={false}
          title={t.target}
          value={profile ? t.targetValue(formatNumber(profile.dailyTargetKcal)) : undefined}
          onPress={() => edit('/onboarding/target')}
        />
        <SettingsRow
          testID="settings-goal"
          title={t.goal}
          value={profile ? strings.onboarding.goal[profile.goal] : undefined}
          onPress={() => edit('/onboarding/goal')}
        />
        {/* Only kcal and kg exist in the demo, so the unit rows are informational. */}
        <SettingsRow title={t.energyUnit} value={strings.common.kcal} />
        <SettingsRow title={t.weightUnit} value={strings.common.kg} />
        <SettingsRow
          testID="settings-language"
          title={t.language}
          value={t.languageOptions[language]}
          onPress={chooseLanguage}
        />
      </SettingsSection>

      <SettingsSection title={t.sections.tracking}>
        <SettingsRow
          testID="settings-weight"
          divider={false}
          title={t.weightTracking}
          subtitle={t.weightTrackingHint}
          toggle={{
            value: profile?.weightTracking ?? false,
            onChange: (weightTracking) => updateProfile({ weightTracking }),
          }}
        />
        {/* No notifications in the demo: shown as coming later, nothing is scheduled. */}
        <SettingsRow
          testID="settings-reminders"
          title={t.reminders}
          subtitle={t.soon}
          muted
          toggle={{ value: false, onChange: () => {}, disabled: true }}
        />
        <SettingsRow
          testID="settings-pause"
          title={t.pause}
          subtitle={t.pauseHint}
          toggle={{
            value: profile?.paused ?? false,
            onChange: (paused) => updateProfile({ paused }),
          }}
        />
      </SettingsSection>

      <SettingsSection title={t.sections.data}>
        <SettingsRow testID="settings-export" divider={false} title={t.export} onPress={exportCsv} />
        {/* Post-demo (backup & sync needs the backend). */}
        <SettingsRow testID="settings-backup" title={t.backup} badge={t.soon} muted />
        <SettingsRow testID="settings-delete" title={t.deleteAll} destructive onPress={deleteAll} />
      </SettingsSection>

      <SettingsSection title={t.sections.help}>
        <SettingsRow testID="settings-support" divider={false} title={t.support} onPress={support} />
        <SettingsRow
          testID="settings-privacy"
          title={t.privacy}
          onPress={() => router.push('/privacy')}
        />
        {/* Post-demo (Plus subscription, M2). */}
        <SettingsRow testID="settings-restore" title={t.restore} badge={t.soon} muted />
        <SettingsRow title={t.foodData} subtitle={t.foodDataHint} />
      </SettingsSection>

      {devVisible ? <DevSection /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    top: decor.homeBlob.top,
    right: decor.homeBlob.right,
    width: decor.homeBlob.width,
    height: decor.homeBlob.height,
    borderRadius: radius.pill,
    backgroundColor: colors.mint,
  },
  header: { minHeight: size.minTouch, flexDirection: 'row', alignItems: 'center' },
});
