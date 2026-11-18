import { PlaceholderScreen } from '@/components';
import ro from '@/i18n/ro';

/** Product found (from scan); built in T4.2. */
export default function ProductFoundScreen() {
  return <PlaceholderScreen title={ro.placeholder.productFound} dismiss="back" />;
}
