import { PlaceholderScreen } from '@/components';
import ro from '@/i18n/ro';

/** Planuri is post-demo (not designed yet): a calm "coming soon" message. */
export default function PlansScreen() {
  return (
    <PlaceholderScreen title={ro.tabs.plans} body={ro.placeholder.plansBody} bottomInset={false} />
  );
}
