import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/tabs';
import {
  Calendar,
  ChartNoAxesColumn,
  House,
  Plus,
  Settings,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import ro from '@/i18n/ro';
import { borderWidth, colors, iconStroke, opacity, radius, shadow, size, space } from '@/theme';

import { AppText } from './AppText';

interface TabConfig {
  name: string;
  label: string;
  icon: LucideIcon;
}

/** Tab routes in `(tabs)/`, left and right of the center Log button. */
const LEFT_TABS: TabConfig[] = [
  { name: 'index', label: ro.tabs.home, icon: House },
  { name: 'progress', label: ro.tabs.progress, icon: ChartNoAxesColumn },
];
const RIGHT_TABS: TabConfig[] = [
  { name: 'plans', label: ro.tabs.plans, icon: Calendar },
  { name: 'settings', label: ro.tabs.settings, icon: Settings },
];

/**
 * Custom bottom tab bar (Main.html): four tabs with an active underline and a 56 brand
 * Log button in the center that opens Add food (`/add`). Not a tab route itself.
 */
export function TabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const focusedName = state.routes[state.index]?.name;

  const renderTab = ({ name, label, icon: Icon }: TabConfig) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return <View key={name} style={styles.slot} />;
    const focused = focusedName === name;
    const onPress = () => {
      const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!focused && !event.defaultPrevented) navigateToTab(route.key);
    };
    return (
      <Pressable
        key={name}
        testID={`tab-${name}`}
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: focused }}
        style={({ pressed }) => [styles.slot, styles.tab, pressed && styles.pressed]}
      >
        <Icon
          size={size.iconM}
          color={focused ? colors.brand : colors.textNav}
          strokeWidth={focused ? iconStroke.navActive : iconStroke.thin}
        />
        <AppText variant={focused ? 'tabLabelActive' : 'tabLabel'} color={focused ? 'brand' : 'textNav'}>
          {label}
        </AppText>
        <View style={[styles.indicator, focused && styles.indicatorActive]} />
      </Pressable>
    );
  };

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={ro.tabs.navigation}
      style={[styles.bar, { paddingBottom: insets.bottom }]}
    >
      {LEFT_TABS.map(renderTab)}
      <View style={styles.slot}>
        <Pressable
          testID="tab-log"
          onPress={() => router.push('/add')}
          accessibilityRole="button"
          accessibilityLabel={ro.tabs.log}
          style={({ pressed }) => [styles.log, pressed && styles.logPressed]}
        >
          <Plus size={size.iconM} color={colors.onBrand} strokeWidth={iconStroke.bold} />
        </Pressable>
      </View>
      {RIGHT_TABS.map(renderTab)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: space.xs,
    paddingHorizontal: space.xs,
    backgroundColor: colors.surface,
    borderTopWidth: borderWidth.hairline,
    borderTopColor: colors.tabBarBorder,
  },
  slot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tab: { height: size.tabBar, gap: space.xxs },
  pressed: { opacity: opacity.pressed },
  indicator: { height: size.tabIndicatorHeight, width: size.tabIndicatorWidth, borderRadius: radius.pill },
  indicatorActive: { backgroundColor: colors.brand },
  log: {
    width: size.fab,
    height: size.fab,
    borderRadius: radius.pill,
    marginTop: -space.l,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
    ...shadow.logButton,
  },
  logPressed: { backgroundColor: colors.brandPressed },
});
