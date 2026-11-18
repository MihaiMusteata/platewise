import { PlaceholderScreen } from '@/components';
import ro from '@/i18n/ro';

/** Barcode scanner (full-screen modal); built in T4.1. */
export default function ScanScreen() {
  return (
    <PlaceholderScreen
      title={ro.placeholder.scan}
      dismiss="close"
      links={[
        { label: ro.placeholder.productFound, href: '/product/5941234567890', testID: 'link-product' },
        { label: ro.placeholder.notFound, href: '/scan/not-found', testID: 'link-not-found' },
      ]}
    />
  );
}
