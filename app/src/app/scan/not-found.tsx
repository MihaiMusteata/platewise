import { PlaceholderScreen } from '@/components';
import ro from '@/i18n/ro';

/** Scan: product not found; built in T4.2. */
export default function ScanNotFoundScreen() {
  return (
    <PlaceholderScreen
      title={ro.placeholder.notFound}
      dismiss="back"
      links={[{ label: ro.placeholder.newProduct, href: '/scan/new-product', testID: 'link-new-product' }]}
    />
  );
}
