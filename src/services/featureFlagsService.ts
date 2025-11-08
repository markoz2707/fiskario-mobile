import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileErrorHandler } from './mobileErrorHandler';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
  conditions?: any[];
}

class FeatureFlagsService {
  private static instance: FeatureFlagsService;
  private cacheKey = 'feature_flags_cache';
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  static getInstance(): FeatureFlagsService {
    if (!FeatureFlagsService.instance) {
      FeatureFlagsService.instance = new FeatureFlagsService();
    }
    return FeatureFlagsService.instance;
  }

  // Check if a feature is enabled
  async isFeatureEnabled(featureName: string, context: any = {}): Promise<boolean> {
    try {
      // Check cache first
      const cached = await this.getCachedFeatureFlags();
      if (cached && cached[featureName]) {
        return this.evaluateFeatureFlag(cached[featureName], context);
      }

      // Fetch from server
      const flags = await this.fetchFeatureFlagsFromServer();
      await this.cacheFeatureFlags(flags);

      const flag = flags.find(f => f.name === featureName);
      return flag ? this.evaluateFeatureFlag(flag, context) : false;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'isFeatureEnabled');
      return false; // Fail-safe: disable feature on error
    }
  }

  // Evaluate feature flag based on conditions and rollout
  private evaluateFeatureFlag(flag: FeatureFlag, context: any): boolean {
    // If globally disabled, return false
    if (!flag.enabled) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const userId = context.userId || context.deviceId || 'anonymous';
      const hash = this.generateHash(userId);
      const rolloutValue = (hash % 100) + 1;
      if (rolloutValue > flag.rolloutPercentage) {
        return false;
      }
    }

    // Check conditions
    if (flag.conditions && flag.conditions.length > 0) {
      return this.evaluateConditions(flag.conditions, context);
    }

    return true;
  }

  // Evaluate conditions for feature flag
  private evaluateConditions(conditions: any[], context: any): boolean {
    for (const condition of conditions) {
      const contextValue = context[condition.key];

      if (contextValue === undefined) {
        return false; // Required condition key not present
      }

      switch (condition.operator) {
        case 'equals':
          if (contextValue !== condition.value) return false;
          break;
        case 'contains':
          if (typeof contextValue === 'string' && typeof condition.value === 'string') {
            if (!contextValue.includes(condition.value)) return false;
          } else {
            return false;
          }
          break;
        case 'greater_than':
          if (typeof contextValue === 'number' && typeof condition.value === 'number') {
            if (contextValue <= condition.value) return false;
          } else {
            return false;
          }
          break;
        case 'less_than':
          if (typeof contextValue === 'number' && typeof condition.value === 'number') {
            if (contextValue >= condition.value) return false;
          } else {
            return false;
          }
          break;
        case 'in':
          if (Array.isArray(condition.value)) {
            if (!condition.value.includes(contextValue)) return false;
          } else {
            return false;
          }
          break;
        default:
          return false;
      }
    }

    return true; // All conditions passed
  }

  // Generate consistent hash for rollout percentage
  private generateHash(identifier: string): number {
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Fetch feature flags from server
  private async fetchFeatureFlagsFromServer(): Promise<FeatureFlag[]> {
    try {
      const response = await fetch('/api/feature-flags', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch feature flags');
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      mobileErrorHandler.handleError(error, 'fetchFeatureFlagsFromServer');
      return [];
    }
  }

  // Check specific feature flag from server
  async checkFeatureFromServer(featureName: string, context: any = {}): Promise<boolean> {
    try {
      const response = await fetch(`/api/feature-flags/check/${featureName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add auth headers
        },
      });

      if (!response.ok) {
        throw new Error('Failed to check feature flag');
      }

      const data = await response.json();
      return data.enabled || false;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'checkFeatureFromServer');
      return false;
    }
  }

  // Cache feature flags locally
  private async cacheFeatureFlags(flags: FeatureFlag[]): Promise<void> {
    try {
      const cacheData = {
        flags,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      mobileErrorHandler.handleError(error, 'cacheFeatureFlags');
    }
  }

  // Get cached feature flags
  private async getCachedFeatureFlags(): Promise<Record<string, FeatureFlag> | null> {
    try {
      const cached = await AsyncStorage.getItem(this.cacheKey);
      if (!cached) return null;

      const parsed = JSON.parse(cached);

      // Check if cache is expired
      if (Date.now() - parsed.timestamp > this.cacheExpiry) {
        await AsyncStorage.removeItem(this.cacheKey);
        return null;
      }

      // Convert array to object for faster lookup
      const flagsMap: Record<string, FeatureFlag> = {};
      parsed.flags.forEach((flag: FeatureFlag) => {
        flagsMap[flag.name] = flag;
      });

      return flagsMap;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getCachedFeatureFlags');
      return null;
    }
  }

  // Clear cache
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.cacheKey);
    } catch (error) {
      mobileErrorHandler.handleError(error, 'clearCache');
    }
  }

  // Get all cached feature flags for debugging
  async getAllCachedFlags(): Promise<FeatureFlag[]> {
    try {
      const cached = await this.getCachedFeatureFlags();
      return cached ? Object.values(cached) : [];
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getAllCachedFlags');
      return [];
    }
  }
}

export default FeatureFlagsService;