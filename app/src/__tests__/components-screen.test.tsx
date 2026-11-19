import { render, screen } from '@testing-library/react-native';

import ComponentsScreen from '@/app/dev/components';
import { strings } from '@/i18n';

jest.mock('expo-router', () => ({ router: { back: jest.fn() } }));

describe('ComponentsScreen', () => {
  it('renders every section', async () => {
    await render(<ComponentsScreen />);
    for (const title of Object.values(strings.dev.sections)) {
      expect(screen.getByText(title)).toBeTruthy();
    }
  });
});
