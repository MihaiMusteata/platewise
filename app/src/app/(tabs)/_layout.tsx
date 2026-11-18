import { Redirect, Tabs } from 'expo-router';

import { TabBar } from '@/components';
import ro from '@/i18n/ro';
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
      <Tabs.Screen name="index" options={{ title: ro.tabs.home }} />
      <Tabs.Screen name="progress" options={{ title: ro.tabs.progress }} />
      <Tabs.Screen name="plans" options={{ title: ro.tabs.plans }} />
      <Tabs.Screen name="settings" options={{ title: ro.tabs.settings }} />
    </Tabs>
  );
}
