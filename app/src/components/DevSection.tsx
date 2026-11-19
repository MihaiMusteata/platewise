import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { SettingsRow, SettingsSection } from '@/components/SettingsRow';
import { getDb } from '@/db';
import { strings } from '@/i18n';
import { clearDemoData, hasDemoData, seedDemoData } from '@/services/demoData';
import { resetScanCounter } from '@/services/scanCounter';
import { useLogStore } from '@/stores/log';

const t = strings.dev.section;

/** Hidden dev tools at the bottom of Settings (revealed by long-pressing the title). */
export function DevSection() {
  const [demo, setDemo] = useState(hasDemoData);
  const [busy, setBusy] = useState(false);

  const toggleDemo = async (on: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      const db = await getDb();
      if (on) await seedDemoData(db);
      else await clearDemoData(db);
      await useLogStore.getState().load();
      setDemo(hasDemoData());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setBusy(false);
    }
  };

  const resetScans = async () => {
    await resetScanCounter();
    Alert.alert(t.scansResetTitle, t.scansResetBody);
  };

  return (
    <SettingsSection title={t.title}>
      <SettingsRow
        title={t.demoData}
        subtitle={t.demoDataHint}
        toggle={{ value: demo, onChange: toggleDemo, disabled: busy }}
        testID="dev-demo-data"
      />
      <SettingsRow title={t.resetScans} onPress={resetScans} divider testID="dev-reset-scans" />
      <SettingsRow
        title={strings.dev.components}
        onPress={() => router.push('/dev/components')}
        divider
        testID="dev-components"
      />
    </SettingsSection>
  );
}
