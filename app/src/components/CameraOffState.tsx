import { CameraOff } from 'lucide-react-native';

import ro from '@/i18n/ro';
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
      headerTitle={ro.scan.title}
      dismiss="close"
      onDismiss={onClose}
      icon={CameraOff}
      title={ro.scan.cameraOff.title}
      body={ro.scan.cameraOff.body}
      topSpace={space.xxxl}
      actions={
        <>
          <Button
            testID="camera-settings"
            label={ro.scan.cameraOff.openSettings}
            onPress={onOpenSettings}
          />
          <Button
            testID="scan-manual"
            variant="outline"
            label={ro.scan.manualEntry}
            onPress={onManualEntry}
          />
        </>
      }
    />
  );
}
