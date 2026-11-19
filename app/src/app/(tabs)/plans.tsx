import { PlaceholderScreen } from '@/components';
import { strings } from '@/i18n';

/** Planuri is post-demo (not designed yet): a calm "coming soon" message. */
export default function PlansScreen() {
  return (
    <PlaceholderScreen title={strings.tabs.plans} body={strings.placeholder.plansBody} bottomInset={false} />
  );
}
