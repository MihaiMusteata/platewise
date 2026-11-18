import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// lucide-react-native ships ESM for React Native; render every icon as a plain View in tests.
jest.mock('lucide-react-native', () => {
  const { createElement } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const icons: Record<string, unknown> = {};
  return new Proxy(icons, {
    get: (target, name) => {
      if (name === '__esModule') return true;
      if (typeof name !== 'string') return undefined;
      if (!(name in target)) {
        const Icon = (props: Record<string, unknown>) =>
          createElement(View, { testID: `icon-${name}`, ...props });
        Icon.displayName = name;
        target[name] = Icon;
      }
      return target[name];
    },
  });
});

// Reanimated 4 can't run its worklet runtime under Jest, so render ReanimatedSwipeable as a plain
// View that always shows its right actions (tests reach delete through the accessibility action
// or the revealed button). Gesture handler's own Jest setup covers the rest of the library.
require('react-native-gesture-handler/jestSetup');
jest.mock('react-native-gesture-handler/ReanimatedSwipeable', () => {
  const { createElement } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const methods = { close: () => {}, openLeft: () => {}, openRight: () => {}, reset: () => {} };
  const Swipeable = ({
    children,
    renderRightActions,
    testID,
  }: {
    children?: unknown;
    renderRightActions?: (...args: unknown[]) => unknown;
    testID?: string;
  }) =>
    createElement(View, { testID }, children, renderRightActions?.(undefined, undefined, methods));
  return { __esModule: true, default: Swipeable, SwipeDirection: { LEFT: 'left', RIGHT: 'right' } };
});
