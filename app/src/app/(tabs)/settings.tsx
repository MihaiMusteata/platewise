import { PlaceholderScreen } from '@/components';
import ro from '@/i18n/ro';

/** Placeholder; built in the Settings task. */
export default function SettingsScreen() {
  return <PlaceholderScreen title={ro.tabs.settings} bottomInset={false} />;
}
