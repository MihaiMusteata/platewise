import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { ProgressBar, clampProgress } from '@/components';

describe('clampProgress', () => {
  it('clamps to 0..1', () => {
    expect(clampProgress(-0.5)).toBe(0);
    expect(clampProgress(0.42)).toBe(0.42);
    expect(clampProgress(1.8)).toBe(1);
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});

describe('ProgressBar', () => {
  const fillWidth = () => StyleSheet.flatten(screen.getByTestId('progress-fill').props.style).width;

  it('fills proportionally', async () => {
    await render(<ProgressBar value={0.25} />);
    expect(fillWidth()).toBe('25%');
  });

  it('never overflows or goes negative', async () => {
    await render(<ProgressBar value={1.4} />);
    expect(fillWidth()).toBe('100%');
    await render(<ProgressBar value={-1} />);
    expect(fillWidth()).toBe('0%');
  });
});
