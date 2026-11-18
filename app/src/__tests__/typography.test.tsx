import { render, screen } from '@testing-library/react-native';

import TypographyScreen from '@/app/dev/typography';
import { type } from '@/theme';

describe('TypographyScreen', () => {
  it('renders every type style', async () => {
    await render(<TypographyScreen />);
    for (const name of Object.keys(type)) {
      expect(screen.getByText(new RegExp(`^${name} `))).toBeTruthy();
    }
  });
});
