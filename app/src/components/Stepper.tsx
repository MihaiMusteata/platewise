import { Minus, Plus } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import ro from '@/i18n/ro';
import { formatDecimal } from '@/lib/format';
import { colors, iconStroke, opacity, radius, shadow, size, space } from '@/theme';

import { AppText } from './AppText';

export interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  /** Unit after the value, e.g. "g" or "bol". */
  unit?: string;
  /** Custom value formatter. Defaults to Romanian decimal without trailing ",0". */
  format?: (value: number) => string;
  accessibilityLabel?: string;
}

const defaultFormat = (value: number) => formatDecimal(value, 1, true);

/** − value + control: white 56-high card with two 48 buttons. */
export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  unit,
  format = defaultFormat,
  accessibilityLabel,
}: StepperProps) {
  const canDec = value > min;
  const canInc = value < max;
  // Round to avoid floating drift with fractional steps (0.5 + 0.1 …).
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v * 1000) / 1000));

  return (
    <View style={styles.box} accessibilityLabel={accessibilityLabel}>
      <Pressable
        onPress={() => canDec && onChange(clamp(value - step))}
        disabled={!canDec}
        accessibilityRole="button"
        accessibilityLabel={ro.common.less}
        accessibilityState={{ disabled: !canDec }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed, !canDec && styles.disabled]}
      >
        <Minus size={size.iconS} color={colors.text} strokeWidth={iconStroke.bold} />
      </Pressable>
      <AppText variant="h2" tabular style={styles.value}>
        {format(value)}
        {unit ? (
          <AppText variant="labelL" color="textSecondary">
            {' '}
            {unit}
          </AppText>
        ) : null}
      </AppText>
      <Pressable
        onPress={() => canInc && onChange(clamp(value + step))}
        disabled={!canInc}
        accessibilityRole="button"
        accessibilityLabel={ro.common.more}
        accessibilityState={{ disabled: !canInc }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed, !canInc && styles.disabled]}
      >
        <Plus size={size.iconS} color={colors.text} strokeWidth={iconStroke.bold} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: size.input,
    borderRadius: radius.m,
    backgroundColor: colors.surface,
    paddingHorizontal: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.card,
  },
  button: {
    width: size.iconButton,
    height: size.iconButton,
    borderRadius: radius.m,
    backgroundColor: colors.neutralSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: colors.border },
  disabled: { opacity: opacity.disabled },
  value: { letterSpacing: 0 },
});
