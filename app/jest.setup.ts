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
