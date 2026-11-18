import { render, screen } from '@testing-library/react-native';

import { MacroCard } from '@/components';

describe('MacroCard', () => {
  it('shows label, "x g / y g" and percent', async () => {
    await render(<MacroCard macro="protein" value={62} goal={150} />);
    expect(screen.getByText('Proteine')).toBeTruthy();
    expect(screen.getByText('62 g / 150 g')).toBeTruthy();
    expect(screen.getByText('41%')).toBeTruthy();
  });

  it('formats thousands and rounds grams', async () => {
    await render(<MacroCard macro="carbs" value={1234.6} goal={2000} />);
    expect(screen.getByText('1.235 g / 2.000 g')).toBeTruthy();
  });
});
