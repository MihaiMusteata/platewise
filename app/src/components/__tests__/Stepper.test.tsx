import { fireEvent, render, screen } from '@testing-library/react-native';
import { useState } from 'react';

import { Stepper } from '@/components';
import ro from '@/i18n/ro';

function Harness({ initial, min, max, step }: { initial: number; min?: number; max?: number; step?: number }) {
  const [value, setValue] = useState(initial);
  return <Stepper value={value} onChange={setValue} min={min} max={max} step={step} unit="g" />;
}

const less = () => screen.getByRole('button', { name: ro.common.less });
const more = () => screen.getByRole('button', { name: ro.common.more });

describe('Stepper', () => {
  it('increments and decrements by step', async () => {
    await render(<Harness initial={250} step={10} />);
    await fireEvent.press(more());
    expect(screen.getByText(/^260/)).toBeTruthy();
    await fireEvent.press(less());
    await fireEvent.press(less());
    expect(screen.getByText(/^240/)).toBeTruthy();
  });

  it('formats fractional values the Romanian way', async () => {
    await render(<Harness initial={1} step={0.5} />);
    await fireEvent.press(more());
    expect(screen.getByText(/^1,5/)).toBeTruthy();
  });

  it('respects min and max', async () => {
    const onChange = jest.fn();
    await render(<Stepper value={5} onChange={onChange} min={5} max={10} step={10} />);
    await fireEvent.press(less());
    expect(onChange).not.toHaveBeenCalled();
    await fireEvent.press(more());
    expect(onChange).toHaveBeenCalledWith(10);
  });

  it('does not go above max', async () => {
    const onChange = jest.fn();
    await render(<Stepper value={10} onChange={onChange} max={10} />);
    await fireEvent.press(more());
    expect(onChange).not.toHaveBeenCalled();
  });
});
