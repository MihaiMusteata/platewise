import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, shadow, size, space } from '@/theme';

import { AppText } from './AppText';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  /** 'm' = 48 high, 14 bold labels (default); 'l' = 56 high, 16 bold labels, lifted selection. */
  size?: 'm' | 'l';
}

/** 48-high pill track with equal-width segments; the selected one is brand filled. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  size: controlSize = 'm',
}: SegmentedControlProps<T>) {
  const large = controlSize === 'l';
  return (
    <View style={[styles.track, large && styles.trackLarge]} accessibilityRole="tablist" accessibilityLabel={accessibilityLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            testID={`segment-${option.value}`}
            onPress={() => onChange(option.value)}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.segment,
              selected && styles.selected,
              selected && large && styles.selectedLarge,
              pressed && !selected && styles.pressed,
            ]}
          >
            <AppText variant={large ? 'button' : 'bodyStrong'} color={selected ? 'onBrand' : 'textTertiary'}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: size.chip,
    padding: space.xxs,
    gap: space.xxs,
    borderRadius: radius.pill,
    backgroundColor: colors.segmentTrack,
    flexDirection: 'row',
  },
  segment: {
    flex: 1,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackLarge: { height: size.segmentL },
  selected: { backgroundColor: colors.brand },
  selectedLarge: shadow.segment,
  pressed: { backgroundColor: colors.neutralSoft },
});
