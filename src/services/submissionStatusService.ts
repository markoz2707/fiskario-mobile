import { apiSlice } from '../store/api/apiSlice';
import { API_BASE_URL } from '../config';

export interface SubmissionStatus {
  id: string;
  type: string;
  period: string;
  status: 'draft' | 'calculating' | 'ready' | 'submitted' | 'accepted' | 'rejected' | 'error';
  submittedAt?: string;
  upoNumber?: string;
  upoDate?: string;
  errorMessage?: string;
  progress?: number;
  canRetry?: boolean;
}

export interface StatusUpdate {
  declarationId: string;
  status: SubmissionStatus['status'];
  message?: string;
  progress?: number;
  upoNumber?: string;
  upoDate?: string;
  error?: string;
}

export class SubmissionStatusService {
  private static instance: SubmissionStatusService;
  private statusCallbacks: Map<string, (status: SubmissionStatus) => void> = new Map();
  private statusCache: Map<string, SubmissionStatus> = new Map();

  public static getInstance(): SubmissionStatusService {
    if (!SubmissionStatusService.instance) {
      SubmissionStatusService.instance = new SubmissionStatusService();
    }
    return SubmissionStatusService.instance;
  }

  /**
   * Track submission status for a declaration
   */
  async trackSubmission(declarationId: string, callback: (status: SubmissionStatus) => void): Promise<void> {
    this.statusCallbacks.set(declarationId, callback);

    // Get initial status
    const initialStatus = await this.getSubmissionStatus(declarationId);
    callback(initialStatus);

    // Start polling for updates if submission is in progress
    if (['submitted', 'calculating'].includes(initialStatus.status)) {
      this.startStatusPolling(declarationId);
    }
  }

  /**
   * Stop tracking submission status
   */
  stopTracking(declarationId: string): void {
    this.statusCallbacks.delete(declarationId);
  }

  /**
   * Get current submission status
   */
  async getSubmissionStatus(declarationId: string): Promise<SubmissionStatus> {
    // Check cache first
    if (this.statusCache.has(declarationId)) {
      return this.statusCache.get(declarationId)!;
    }

    try {
      // This would typically fetch from the API
      // For now, return mock data
      const mockStatus: SubmissionStatus = {
        id: declarationId,
        type: 'VAT-7',
        period: '2024-10',
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        progress: 75,
      };

      this.statusCache.set(declarationId, mockStatus);
      return mockStatus;
    } catch (error) {
      console.error('Error getting submission status:', error);
      return {
        id: declarationId,
        type: 'Unknown',
        period: 'Unknown',
        status: 'error',
        errorMessage: 'Failed to get status',
      };
    }
  }

  /**
   * Get all submission statuses for a company
   */
  async getAllSubmissionStatuses(companyId: string): Promise<SubmissionStatus[]> {
    try {
      // This would typically fetch from the API
      // For now, return mock data
      return [
        {
          id: '1',
          type: 'VAT-7',
          period: '2024-10',
          status: 'accepted',
          submittedAt: new Date().toISOString(),
          upoNumber: 'UPO-123456789',
          upoDate: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'JPK_V7M',
          period: '2024-09',
          status: 'submitted',
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
          progress: 50,
        },
      ];
    } catch (error) {
      console.error('Error getting submission statuses:', error);
      return [];
    }
  }

  /**
   * Retry failed submission
   */
  async retrySubmission(
    declarationId: string,
    signatureType?: string,
    signatureCredentials?: any
  ): Promise<boolean> {
    try {
      const token = 'mock_token'; // This should be properly retrieved

      const response = await fetch(`${API_BASE_URL}/declarations/retry/${declarationId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatureType,
          signatureCredentials,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update cached status
          const updatedStatus: SubmissionStatus = {
            id: declarationId,
            type: 'VAT-7',
            period: '2024-10',
            status: 'submitted',
            submittedAt: new Date().toISOString(),
            progress: 0,
          };
          this.statusCache.set(declarationId, updatedStatus);

          // Notify callbacks
          const callback = this.statusCallbacks.get(declarationId);
          if (callback) {
            callback(updatedStatus);
          }

          // Start polling again
          this.startStatusPolling(declarationId);

          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error retrying submission:', error);
      return false;
    }
  }

  /**
   * Check for status updates from server
   */
  async checkForUpdates(declarationId: string): Promise<StatusUpdate | null> {
    try {
      const token = 'mock_token'; // This should be properly retrieved

      const response = await fetch(`${API_BASE_URL}/declarations/status/${declarationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return {
            declarationId,
            status: data.data.status,
            message: data.data.message,
            progress: data.data.progress,
            upoNumber: data.data.upoNumber,
            upoDate: data.data.upoDate,
            error: data.data.error,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    }
  }

  /**
   * Start polling for status updates
   */
  private startStatusPolling(declarationId: string): void {
    const pollInterval = setInterval(async () => {
      const update = await this.checkForUpdates(declarationId);

      if (update) {
        // Update cached status
        const currentStatus = this.statusCache.get(declarationId);
        if (currentStatus) {
          const updatedStatus: SubmissionStatus = {
            ...currentStatus,
            status: update.status,
            progress: update.progress,
            upoNumber: update.upoNumber,
            upoDate: update.upoDate,
            errorMessage: update.error,
          };

          this.statusCache.set(declarationId, updatedStatus);

          // Notify callbacks
          const callback = this.statusCallbacks.get(declarationId);
          if (callback) {
            callback(updatedStatus);
          }

          // Stop polling if status is final
          if (['accepted', 'rejected', 'error'].includes(update.status)) {
            clearInterval(pollInterval);
          }
        }
      }
    }, 2000); // Poll every 2 seconds

    // Stop polling after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 600000);
  }

  /**
   * Get status color for UI display
   */
  getStatusColor(status: SubmissionStatus['status']): string {
    switch (status) {
      case 'draft':
        return '#FFA500';
      case 'calculating':
      case 'ready':
        return '#007AFF';
      case 'submitted':
        return '#17A2B8';
      case 'accepted':
        return '#28A745';
      case 'rejected':
        return '#DC3545';
      case 'error':
        return '#DC3545';
      default:
        return '#6C757D';
    }
  }

  /**
   * Get status text for UI display
   */
  getStatusText(status: SubmissionStatus['status']): string {
    switch (status) {
      case 'draft':
        return 'Szkic';
      case 'calculating':
        return 'Obliczanie...';
      case 'ready':
        return 'Gotowa do wysyłki';
      case 'submitted':
        return 'Wysłana';
      case 'accepted':
        return 'Zaakceptowana';
      case 'rejected':
        return 'Odrzucona';
      case 'error':
        return 'Błąd';
      default:
        return status;
    }
  }

  /**
   * Get progress percentage for UI display
   */
  getProgressPercentage(status: SubmissionStatus['status'], progress?: number): number {
    switch (status) {
      case 'draft':
        return 0;
      case 'calculating':
        return Math.min((progress || 0), 50);
      case 'ready':
        return 75;
      case 'submitted':
        return Math.min((progress || 75), 95);
      case 'accepted':
        return 100;
      case 'rejected':
      case 'error':
        return 0;
      default:
        return 0;
    }
  }

  /**
   * Clear all cached statuses
   */
  clearCache(): void {
    this.statusCache.clear();
    this.statusCallbacks.clear();
  }

  /**
   * Get submission statistics for a company
   */
  async getSubmissionStats(companyId: string): Promise<{
    total: number;
    submitted: number;
    accepted: number;
    rejected: number;
    pending: number;
  }> {
    try {
      const statuses = await this.getAllSubmissionStatuses(companyId);

      return {
        total: statuses.length,
        submitted: statuses.filter(s => s.status === 'submitted').length,
        accepted: statuses.filter(s => s.status === 'accepted').length,
        rejected: statuses.filter(s => s.status === 'rejected').length,
        pending: statuses.filter(s => ['calculating', 'ready'].includes(s.status)).length,
      };
    } catch (error) {
      console.error('Error getting submission stats:', error);
      return {
        total: 0,
        submitted: 0,
        accepted: 0,
        rejected: 0,
        pending: 0,
      };
    }
  }
}