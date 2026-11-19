import { CameraOff } from 'lucide-react-native';

import { strings } from '@/i18n';
import { space } from '@/theme';

import { Button } from './Button';
import { StateView } from './StateView';

export interface CameraOffStateProps {
  onClose: () => void;
  onOpenSettings: () => void;
  onManualEntry: () => void;
}

/** Scan screen when camera access is denied (CameraOff.html). */
export function CameraOffState({ onClose, onOpenSettings, onManualEntry }: CameraOffStateProps) {
  return (
    <StateView
      headerTitle={strings.scan.title}
      dismiss="close"
      onDismiss={onClose}
      icon={CameraOff}
      title={strings.scan.cameraOff.title}
      body={strings.scan.cameraOff.body}
      topSpace={space.xxxl}
      actions={
        <>
          <Button
            testID="camera-settings"
            label={strings.scan.cameraOff.openSettings}
            onPress={onOpenSettings}
          />
          <Button
            testID="scan-manual"
            variant="outline"
            label={strings.scan.manualEntry}
            onPress={onManualEntry}
          />
        </>
      }
    />
  );
}
