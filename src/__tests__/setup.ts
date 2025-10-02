import 'react-native-gesture-handler/jestSetup';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Add Jest globals for TypeScript
declare const jest: any;
declare const beforeAll: any;
declare const afterEach: any;
declare const afterAll: any;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');

// Mock expo modules
jest.mock('expo-localization', () => ({
  getLocalizationAsync: jest.fn(() => Promise.resolve({
    locale: 'pl-PL',
    locales: ['pl-PL'],
    timezone: 'Europe/Warsaw',
  })),
}));

jest.mock('expo-camera', () => ({
  Camera: {
    Constants: {
      Type: {
        back: 'back',
        front: 'front',
      },
      FlashMode: {
        off: 'off',
        on: 'on',
        auto: 'auto',
      },
    },
  },
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

// Mock vision camera
jest.mock('react-native-vision-camera', () => ({
  Camera: jest.fn(() => null),
}));

// Mock ML Kit
jest.mock('@react-native-ml-kit/text-recognition', () => ({
  TextRecognition: {
    recognize: jest.fn(),
  },
}));

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  PERMISSIONS: {
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
    },
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
  },
  request: jest.fn(),
  check: jest.fn(),
}));

// Mock NetInfo for offline testing
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
  })),
  addEventListener: jest.fn(),
}));

// Global test utilities
(global as any).testUtils = {
  // Helper to create mock navigation
  createMockNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  }),

  // Helper to create mock store
  createMockStore: (initialState = {}) => ({
    getState: jest.fn(() => initialState),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    replaceReducer: jest.fn(),
  }),

  // Helper to create test user
  createTestUser: (overrides = {}) => ({
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER',
    companyId: 'test-company-id',
    ...overrides,
  }),

  // Helper to create test company
  createTestCompany: (overrides = {}) => ({
    id: 'test-company-id',
    name: 'Test Company',
    nip: '1234567890',
    address: 'Test Address 1',
    phone: '+48 123 456 789',
    email: 'company@test.com',
    ...overrides,
  }),

  // Helper to create test invoice
  createTestInvoice: (overrides = {}) => ({
    id: 'test-invoice-id',
    number: 'FV/2024/001',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    amount: 1000,
    currency: 'PLN',
    status: 'ISSUED',
    contractor: {
      name: 'Test Contractor',
      nip: '9876543210',
    },
    ...overrides,
  }),

  // Helper to wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to mock API responses
  mockApiResponse: (data: any) => ({
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }),

  // Helper to create mock error
  createMockError: (message: string, status = 400) => ({
    message,
    status,
    response: {
      data: { message },
      status,
    },
  }),
};

// Set up console mocks to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  console.error = originalError;
});