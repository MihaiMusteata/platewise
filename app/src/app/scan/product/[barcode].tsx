import { PlaceholderScreen } from '@/components';
import ro from '@/i18n/ro';

/** Product found (from scan); built in T4.2 (lookup, then found / not found / offline). */
export default function ProductFoundScreen() {
  return (
    <PlaceholderScreen
      title={ro.placeholder.productFound}
      dismiss="back"
      links={[{ label: ro.placeholder.notFound, href: '/scan/not-found', testID: 'link-not-found' }]}
    />
  );
}
