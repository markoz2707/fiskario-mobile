import { Database } from '@nozbe/watermelondb';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mobileErrorHandler } from './mobileErrorHandler';
import OfflineInvoiceService from './offlineInvoiceService';

export interface CachedDashboardData {
  summary: any;
  activities: any[];
  deadlines: any[];
  status: any;
  lastUpdated: number;
  companyId: string;
}

class DashboardOfflineService {
  private static instance: DashboardOfflineService;
  private database: Database;
  private cacheKey = 'dashboard_cache';

  constructor(database: Database) {
    this.database = database;
  }

  static getInstance(database?: Database): DashboardOfflineService {
    if (!DashboardOfflineService.instance) {
      if (!database) {
        throw new Error('Database instance required for first initialization');
      }
      DashboardOfflineService.instance = new DashboardOfflineService(database);
    }
    return DashboardOfflineService.instance;
  }

  // Cache dashboard data for offline use
  async cacheDashboardData(companyId: string, data: {
    summary?: any;
    activities?: any[];
    deadlines?: any[];
    status?: any;
  }): Promise<void> {
    try {
      const cacheKey = `${this.cacheKey}_${companyId}`;
      const cachedData: CachedDashboardData = {
        summary: data.summary || null,
        activities: data.activities || [],
        deadlines: data.deadlines || [],
        status: data.status || null,
        lastUpdated: Date.now(),
        companyId,
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachedData));
    } catch (error) {
      mobileErrorHandler.handleError(error, 'cacheDashboardData');
    }
  }

  // Get cached dashboard data
  async getCachedDashboardData(companyId: string): Promise<CachedDashboardData | null> {
    try {
      const cacheKey = `${this.cacheKey}_${companyId}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (!cachedData) return null;

      const parsedData: CachedDashboardData = JSON.parse(cachedData);

      // Check if cache is still valid (24 hours)
      const cacheAge = Date.now() - parsedData.lastUpdated;
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours

      if (cacheAge > maxAge) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }

      return parsedData;
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getCachedDashboardData');
      return null;
    }
  }

  // Check if device is online
  async isOnline(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('https://www.google.com/generate_204', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get dashboard data with offline fallback
  async getDashboardDataWithOfflineFallback(companyId: string, fetchFunction: () => Promise<any>): Promise<any> {
    const isOnline = await this.isOnline();

    if (isOnline) {
      try {
        const freshData = await fetchFunction();
        // Cache the fresh data
        await this.cacheDashboardData(companyId, freshData);
        return { ...freshData, isOffline: false };
      } catch (error) {
        // If online but API fails, try cache
        const cachedData = await this.getCachedDashboardData(companyId);
        if (cachedData) {
          return {
            summary: cachedData.summary,
            activities: cachedData.activities,
            deadlines: cachedData.deadlines,
            status: cachedData.status,
            isOffline: true,
            lastUpdated: cachedData.lastUpdated,
          };
        }
        throw error;
      }
    } else {
      // Offline - return cached data
      const cachedData = await this.getCachedDashboardData(companyId);
      if (cachedData) {
        return {
          summary: cachedData.summary,
          activities: cachedData.activities,
          deadlines: cachedData.deadlines,
          status: cachedData.status,
          isOffline: true,
          lastUpdated: cachedData.lastUpdated,
        };
      }
      throw new Error('No cached data available and device is offline');
    }
  }

  // Enhanced sync mechanism for smooth online/offline transitions
  async syncDashboardOnConnectivityChange(companyId: string, fetchFunction: () => Promise<any>): Promise<void> {
    const isOnline = await this.isOnline();

    if (isOnline) {
      // Coming back online - sync any pending changes
      try {
        const freshData = await fetchFunction();
        await this.cacheDashboardData(companyId, freshData);

        // Check for pending workflow operations and sync them
        const offlineService = OfflineInvoiceService.getInstance(this.database);
        await offlineService.attemptAutoSync(
          async (invoiceData) => {
            // Sync invoice data
            console.log('Syncing invoice data:', invoiceData.id);
          },
          async (operation) => {
            // Sync workflow operations
            console.log('Syncing workflow operation:', operation.id);
          }
        );
      } catch (error) {
        mobileErrorHandler.handleError(error, 'syncDashboardOnConnectivityChange');
      }
    } else {
      // Going offline - ensure we have cached data
      const cachedData = await this.getCachedDashboardData(companyId);
      if (!cachedData) {
        // Pre-cache essential data for offline use
        try {
          const freshData = await fetchFunction();
          await this.cacheDashboardData(companyId, freshData);
        } catch (error) {
          // If we can't fetch fresh data, at least cache what we have
          console.warn('Could not pre-cache dashboard data for offline use');
        }
      }
    }
  }

  // Monitor connectivity and handle transitions
  startConnectivityMonitoring(companyId: string, fetchFunction: () => Promise<any>): void {
    let lastOnlineStatus = true;

    const checkConnectivity = async () => {
      const isOnline = await this.isOnline();

      if (isOnline !== lastOnlineStatus) {
        // Connectivity status changed
        await this.syncDashboardOnConnectivityChange(companyId, fetchFunction);
        lastOnlineStatus = isOnline;
      }
    };

    // Check every 30 seconds
    setInterval(checkConnectivity, 30000);

    // Initial check
    checkConnectivity();
  }

  // Clear old cache data
  async clearOldCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dashboardKeys = keys.filter(key => key.startsWith(this.cacheKey));

      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      for (const key of dashboardKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          const parsedData: CachedDashboardData = JSON.parse(data);
          if (parsedData.lastUpdated < sevenDaysAgo) {
            await AsyncStorage.removeItem(key);
          }
        }
      }
    } catch (error) {
      mobileErrorHandler.handleError(error, 'clearOldCache');
    }
  }

  // Get cache size for debugging
  async getCacheSize(): Promise<{ totalKeys: number; totalSize: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dashboardKeys = keys.filter(key => key.startsWith(this.cacheKey));

      let totalSize = 0;
      for (const key of dashboardKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          totalSize += data.length;
        }
      }

      return {
        totalKeys: dashboardKeys.length,
        totalSize,
      };
    } catch (error) {
      mobileErrorHandler.handleError(error, 'getCacheSize');
      return { totalKeys: 0, totalSize: 0 };
    }
  }
}

export default DashboardOfflineService;