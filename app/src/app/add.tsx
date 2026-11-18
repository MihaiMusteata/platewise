import { PlaceholderScreen } from '@/components';
import ro from '@/i18n/ro';

/** Add food (search) modal; built in T3.1. */
export default function AddFoodScreen() {
  return (
    <PlaceholderScreen
      title={ro.placeholder.add}
      dismiss="close"
      links={[
        { label: ro.placeholder.scan, href: '/scan', testID: 'link-scan' },
        { label: ro.placeholder.food, href: '/food/common:sample', testID: 'link-food' },
      ]}
    />
  );
}
