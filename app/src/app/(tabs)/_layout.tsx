import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components';
import { strings } from '@/i18n';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme';

export default function TabsLayout() {
  const hasOnboarded = useProfileStore((state) => state.hasOnboarded);
  if (!hasOnboarded) return <Redirect href="/onboarding/about" />;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.background } }}
    >
      <Tabs.Screen name="index" options={{ title: strings.tabs.home }} />
      <Tabs.Screen name="progress" options={{ title: strings.tabs.progress }} />
      <Tabs.Screen name="plans" options={{ title: strings.tabs.plans }} />
      <Tabs.Screen name="settings" options={{ title: strings.tabs.settings }} />
    </Tabs>
  );
}
