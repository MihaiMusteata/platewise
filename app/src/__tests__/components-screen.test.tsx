import { render, screen } from '@testing-library/react-native';

import ComponentsScreen from '@/app/dev/components';
import ro from '@/i18n/ro';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

describe('ComponentsScreen', () => {
  it('renders every section', async () => {
    await render(<ComponentsScreen />);
    for (const title of Object.values(ro.dev.sections)) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });
});
