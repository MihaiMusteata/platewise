import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { strings } from '@/i18n';
import { checkBarcodeEntry, type BarcodeEntryError } from '@/lib/barcode';
import { colors, layout, radius, space } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { TextField } from './TextField';

export interface ManualBarcodeSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Called with the canonical (normalised, validated) code. */
  onSubmit: (code: string) => void;
}

/** Bottom sheet to type a barcode. Invalid entries get a calm amber hint on submit. */
export function ManualBarcodeSheet({ visible, onClose, onSubmit }: ManualBarcodeSheetProps) {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState('');
  const [error, setError] = useState<BarcodeEntryError | null>(null);

  const close = () => {
    setValue('');
    setError(null);
    onClose();
  };

  const submit = () => {
    const result = checkBarcodeEntry(value);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setValue('');
    setError(null);
    onSubmit(result.code);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel={strings.common.close}
          testID="manual-backdrop"
        />
        <View
          style={[styles.sheet, { paddingBottom: insets.bottom + space.l }]}
          accessibilityViewIsModal
        >
          <View style={styles.text}>
            <AppText variant="h3" accessibilityRole="header">
              {strings.scan.manual.title}
            </AppText>
            <AppText variant="bodyL" color="textSecondary">
              {strings.scan.manual.body}
            </AppText>
          </View>
          <TextField
            testID="manual-input"
            label={strings.scan.manual.label}
            value={value}
            onChangeText={(text) => {
              setValue(text);
              setError(null);
            }}
            keyboardType="number-pad"
            autoFocus
            maxLength={16}
            textContentType="none"
            autoComplete="off"
            error={error ? strings.scan.manual.errors[error] : undefined}
          />
          <View style={styles.actions}>
            <Button testID="manual-submit" label={strings.scan.manual.submit} onPress={submit} />
            <Button testID="manual-cancel" variant="text" label={strings.common.cancel} onPress={close} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.l,
    borderTopRightRadius: radius.l,
    paddingTop: space.l,
    paddingHorizontal: layout.screenPaddingX,
    gap: space.l,
  },
  text: { gap: space.xs },
  actions: { gap: space.xs },
});
