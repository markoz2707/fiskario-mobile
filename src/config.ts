import { Platform } from 'react-native';

// Use EXPO_PUBLIC_API_URL env var if set, otherwise default based on platform:
// - Android emulator: 10.0.2.2 (maps to host machine's localhost)
// - iOS simulator / web: localhost
const DEFAULT_API_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:3000'
  : 'http://localhost:3000';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;