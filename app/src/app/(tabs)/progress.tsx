import { PlaceholderScreen } from '@/components';
import ro from '@/i18n/ro';

/** Placeholder; built in the Progress task. */
export default function ProgressScreen() {
  return <PlaceholderScreen title={ro.tabs.progress} bottomInset={false} />;
}
