import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '@/components';

describe('Button', () => {
  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continuă" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continuă' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button label="Continuă" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole('button', { name: 'Continuă' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
