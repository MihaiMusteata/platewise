import { fireEvent, render, screen } from '@testing-library/react-native';

import { Snackbar } from '@/components';

describe('Snackbar', () => {
  it('shows the message and fires the undo action', async () => {
    const onAction = jest.fn();
    await render(<Snackbar message="Cafea cu lapte ștearsă" onAction={onAction} />);
    expect(screen.getByText('Cafea cu lapte ștearsă')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Anulează' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
