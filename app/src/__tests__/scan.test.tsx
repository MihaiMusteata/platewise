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

const Home = () => <Text>home</Text>;
const Product = () => <Text>product</Text>;

const routes = {
  index: Home,
  'scan/_layout': ScanFlowLayout,
  'scan/index': ScanScreen,
  'scan/product/[barcode]': Product,
};

const granted: MockPermission = { granted: true, status: 'granted', canAskAgain: true };
const denied: MockPermission = { granted: false, status: 'denied', canAskAgain: false };

const scan = (data: string, type = 'ean13') =>
  act(async () => mockOnScan?.({ data, type } as BarcodeScanningResult));

beforeEach(() => {
  mockOnScan = undefined;
  mockRequestPermission.mockClear();
});

describe('Scan screen — camera granted', () => {
  beforeEach(() => {
    mockPermission = granted;
  });

  it('renders the camera, frame and copy', async () => {
    await renderRouter(routes, { initialUrl: '/scan' });
    expect(screen.getByTestId('scan-camera')).toBeTruthy();
    expect(screen.getByText(ro.scan.title)).toBeTruthy();
    expect(screen.getByText(ro.scan.instruction)).toBeTruthy();
    expect(mockRequestPermission).not.toHaveBeenCalled();
  });

  it('opens the product for the first valid scan only, and scans again after coming back', async () => {
    await renderRouter(routes, { initialUrl: '/scan' });

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
    await renderRouter(routes, { initialUrl: '/scan' });
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
    await renderRouter(routes, { initialUrl: '/scan' });
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

describe('Scan screen — permission', () => {
  it('asks for camera access when not decided yet', async () => {
    mockPermission = { granted: false, status: 'undetermined', canAskAgain: true };
    await renderRouter(routes, { initialUrl: '/scan' });
    expect(mockRequestPermission).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('scan-camera')).toBeNull();
    expect(screen.queryByText(ro.scan.cameraOff.title)).toBeNull();
  });

  it('shows the camera-off state with settings and manual entry when denied', async () => {
    mockPermission = denied;
    const openSettings = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    await renderRouter(routes, { initialUrl: '/scan' });

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
