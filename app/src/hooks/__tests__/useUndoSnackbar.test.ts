import { act, renderHook } from '@testing-library/react-native';

import { UNDO_DURATION_MS, useUndoSnackbar } from '@/hooks/useUndoSnackbar';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe('useUndoSnackbar', () => {
  it('shows a message and hides it after 5 s', async () => {
    const { result } = await renderHook(() => useUndoSnackbar());
    expect(UNDO_DURATION_MS).toBe(5000);

    await act(async () => result.current.show('Șters', () => {}));
    expect(result.current.current?.message).toBe('Șters');

    await act(async () => jest.advanceTimersByTime(4999));
    expect(result.current.current).not.toBeNull();
    await act(async () => jest.advanceTimersByTime(1));
    expect(result.current.current).toBeNull();
  });

  it('undo runs the callback once and hides the snackbar', async () => {
    const onUndo = jest.fn();
    const { result } = await renderHook(() => useUndoSnackbar());

    await act(async () => result.current.show('Șters', onUndo));
    await act(async () => result.current.undo());
    await act(async () => result.current.undo());

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(result.current.current).toBeNull();
  });

  it('a new message replaces the old one and restarts the timer', async () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result } = await renderHook(() => useUndoSnackbar());

    await act(async () => result.current.show('Primul', first));
    await act(async () => jest.advanceTimersByTime(4000));
    await act(async () => result.current.show('Al doilea', second));
    await act(async () => jest.advanceTimersByTime(4000));
    expect(result.current.current?.message).toBe('Al doilea');

    await act(async () => result.current.undo());
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it('dismiss hides without undoing', async () => {
    const onUndo = jest.fn();
    const { result } = await renderHook(() => useUndoSnackbar());
    await act(async () => result.current.show('Șters', onUndo));
    await act(async () => result.current.dismiss());
    expect(result.current.current).toBeNull();
    expect(onUndo).not.toHaveBeenCalled();
  });
});
