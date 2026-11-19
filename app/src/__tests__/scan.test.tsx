import type { BarcodeScanningResult } from 'expo-camera';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';
import { router } from 'expo-router';
import { Linking, Text } from 'react-native';

import ScanFlowLayout from '@/app/scan/_layout';
import ScanScreen from '@/app/scan/index';
import ro from '@/i18n/ro';

type MockPermission = { granted: boolean; status: string; canAskAgain: boolean } | null;

let mockPermission: MockPermission = null;
let mockOnScan: ((result: BarcodeScanningResult) => void) | undefined;
const mockRequestPermission = jest.fn(async () => mockPermission);
const mockGetPermission = jest.fn(async () => mockPermission);

jest.mock('expo-camera', () => {
  const { createElement } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: (props: {
      testID?: string;
      enableTorch?: boolean;
      onBarcodeScanned?: (result: unknown) => void;
    }) => {
      mockOnScan = props.onBarcodeScanned;
      return createElement(View, { testID: props.testID, enableTorch: props.enableTorch });
    },
    useCameraPermissions: () => [mockPermission, mockRequestPermission, mockGetPermission],
  };
});

let mockRemaining = 7;
jest.mock('@/services/scanCounter', () => ({
  ...jest.requireActual('@/services/scanCounter'),
  getScanStatus: async () =>
    jest.requireActual('@/services/scanCounter').statusFor(10 - mockRemaining),
}));

const Home = () => <Text>home</Text>;
const Search = () => <Text>search</Text>;
const Product = () => <Text>product</Text>;

const routes = {
  index: Home,
  'scan/_layout': ScanFlowLayout,
  'scan/index': ScanScreen,
  'scan/product/[barcode]': Product,
  'add/index': Search,
};

const granted: MockPermission = { granted: true, status: 'granted', canAskAgain: true };
const denied: MockPermission = { granted: false, status: 'denied', canAskAgain: false };

/** Renders the scanner and waits for the camera's mount delay (after the modal transition). */
async function renderScanner() {
  await renderRouter(routes, { initialUrl: '/scan' });
  // expo-router's test renderer runs on fake timers.
  await act(async () => {
    jest.advanceTimersByTime(650);
  });
}

const scan = (data: string, type = 'ean13') =>
  act(async () => mockOnScan?.({ data, type } as BarcodeScanningResult));

beforeEach(() => {
  mockRemaining = 7;
  mockOnScan = undefined;
  mockRequestPermission.mockClear();
});

describe('Scan screen — camera granted', () => {
  beforeEach(() => {
    mockPermission = granted;
  });

  it('renders the camera, frame and copy', async () => {
    await renderScanner();
    expect(screen.getByTestId('scan-camera')).toBeTruthy();
    expect(screen.getByText(ro.scan.title)).toBeTruthy();
    expect(screen.getByText(ro.scan.instruction)).toBeTruthy();
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('opens the product for the first valid scan only, and scans again after coming back', async () => {
    await renderScanner();

    await scan('5449000000997'); // misread check digit: ignored
    expect(screen).toHavePathname('/scan');

    const onScan = mockOnScan;
    await scan('5449000000996');
    expect(screen).toHavePathname('/scan/product/5449000000996');
    // A second callback from the same camera session is ignored.
    await act(async () => onScan?.({ data: '3017620422003', type: 'ean13' } as BarcodeScanningResult));
    expect(screen).toHavePathname('/scan/product/5449000000996');

    await act(async () => router.back());
    expect(screen).toHavePathname('/scan');
    await scan('036000291452', 'upc_a');
    expect(screen).toHavePathname('/scan/product/0036000291452');
  });

  it('toggles the torch', async () => {
    await renderScanner();
    expect(screen.getByTestId('scan-camera').props.enableTorch).toBe(false);
    await fireEvent.press(screen.getByTestId('scan-torch'));
    expect(screen.getByTestId('scan-camera').props.enableTorch).toBe(true);
    expect(screen.getByTestId('scan-torch').props.accessibilityState).toEqual({
      disabled: false,
      selected: true,
    });
  });

  it('closes the modal', async () => {
    await renderRouter(routes, { initialUrl: '/' });
    await act(async () => router.push('/scan'));
    await fireEvent.press(screen.getByTestId('scan-close'));
    expect(screen).toHavePathname('/');
  });

  it('shows a calm hint for an invalid manual code and opens the product for a valid one', async () => {
    await renderScanner();
    await fireEvent.press(screen.getByTestId('scan-manual'));

    await fireEvent.changeText(screen.getByTestId('manual-input'), '12345');
    await fireEvent.press(screen.getByTestId('manual-submit'));
    expect(screen.getByText(ro.scan.manual.errors.format)).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('manual-input'), '5449000000997');
    expect(screen.queryByText(ro.scan.manual.errors.format)).toBeNull();
    await fireEvent.press(screen.getByTestId('manual-submit'));
    expect(screen.getByText(ro.scan.manual.errors.checkDigit)).toBeTruthy();
    expect(screen).toHavePathname('/scan');

    await fireEvent.changeText(screen.getByTestId('manual-input'), '5449000000996');
    await fireEvent.press(screen.getByTestId('manual-submit'));
    expect(screen).toHavePathname('/scan/product/5449000000996');
  });
});

describe('Scan screen — monthly scans', () => {
  beforeEach(() => {
    mockPermission = granted;
  });

  it('shows how many scans are left this month', async () => {
    await renderScanner();
    expect(await screen.findByTestId('scan-remaining')).toHaveTextContent(
      '7 scanări rămase luna aceasta',
    );
    expect(screen.queryByTestId('scan-limit')).toBeNull();
  });

  it('uses the singular for the last scan', async () => {
    mockRemaining = 1;
    await renderScanner();
    expect(await screen.findByTestId('scan-remaining')).toHaveTextContent(
      '1 scanare rămasă luna aceasta',
    );
  });

  it('at the limit shows a calm message, keeps the camera and offers manual search', async () => {
    mockRemaining = 0;
    await renderScanner();
    expect(await screen.findByTestId('scan-limit')).toHaveTextContent(
      /Ai folosit cele 10 scanări din luna aceasta\. Poți căuta manual oricând/,
    );
    expect(screen.queryByTestId('scan-remaining')).toBeNull();
    expect(screen.getByTestId('scan-camera')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('scan-search'));
    expect(screen).toHavePathname('/add');
  });
});

describe('Scan screen — permission', () => {
  it('asks for camera access when not decided yet', async () => {
    mockPermission = { granted: false, status: 'undetermined', canAskAgain: true };
    await renderScanner();
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('scan-camera')).toBeNull();
    expect(screen.queryByText(ro.scan.cameraOff.title)).toBeNull();
  });

  it('shows the camera-off state with settings and manual entry when denied', async () => {
    mockPermission = denied;
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await renderScanner();

    expect(screen.queryByTestId('scan-camera')).toBeNull();
    expect(screen.getByText(ro.scan.cameraOff.title)).toBeTruthy();
    expect(screen.getByText(ro.scan.cameraOff.body)).toBeTruthy();
    expect(mockRequestPermission).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('camera-settings'));
    expect(openSettings).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByTestId('scan-manual'));
    await fireEvent.changeText(screen.getByTestId('manual-input'), '96385074');
    await fireEvent.press(screen.getByTestId('manual-submit'));
    expect(screen).toHavePathname('/scan/product/96385074');
    openSettings.mockRestore();
  });
});
