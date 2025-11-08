import { API_BASE_URL } from '../config';

export interface SubmissionRequest {
  declarationId: string;
  signatureType: 'profil_zaufany' | 'qes' | 'none';
  credentials?: {
    login?: string;
    password?: string;
    certificate?: string;
    privateKey?: string;
    passphrase?: string;
  };
}

export interface SubmissionResponse {
  success: boolean;
  data?: {
    upoNumber?: string;
    upoDate?: string;
    status?: string;
    message?: string;
    signatureInfo?: any;
  };
  message?: string;
  error?: string;
}

export interface UPOData {
  upoNumber: string;
  confirmationDate: string;
  declarationId: string;
  taxpayerNIP: string;
  taxOfficeCode: string;
  formCode: string;
  period: string;
  amount?: number;
  status: string;
  xmlContent: string;
}

export interface StatusSummary {
  total: number;
  draft: number;
  submitted: number;
  processing: number;
  accepted: number;
  rejected: number;
  failed: number;
  lastUpdated: string;
}

export interface FailedDeclaration {
  id: string;
  type: string;
  period: string;
  status: string;
  submittedAt?: string;
  upoNumber?: string;
  xmlContent?: string;
}

class EDeklaracjeService {
  private baseURL = `${API_BASE_URL}/e-deklaracje`;

  /**
   * Submit declaration to e-Deklaracje system
   */
  async submitDeclaration(request: SubmissionRequest): Promise<SubmissionResponse> {
    try {
      const response = await fetch(`${this.baseURL}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Declaration submission failed:', error);
      throw error;
    }
  }

  /**
   * Check declaration status using UPO number
   */
  async checkDeclarationStatus(upoNumber: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({ upoNumber })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Status check failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  }

  /**
   * Get UPO details by number
   */
  async getUPO(upoNumber: string): Promise<UPOData> {
    try {
      const response = await fetch(`${this.baseURL}/upo/${upoNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'UPO retrieval failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('UPO retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get UPOs for a company
   */
  async getUPOsForCompany(companyId: string, limit: number = 50): Promise<UPOData[]> {
    try {
      const response = await fetch(`${this.baseURL}/upos/${companyId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'UPOs retrieval failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('UPOs retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get status summary for a company
   */
  async getStatusSummary(companyId: string): Promise<StatusSummary> {
    try {
      const response = await fetch(`${this.baseURL}/status-summary/${companyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Status summary retrieval failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Status summary retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get failed declarations for a company
   */
  async getFailedDeclarations(companyId: string, limit: number = 50): Promise<FailedDeclaration[]> {
    try {
      const response = await fetch(`${this.baseURL}/failed/${companyId}?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed declarations retrieval failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed declarations retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Reset declaration for retry
   */
  async resetDeclarationForRetry(declarationId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/reset/${declarationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Reset failed');
      }
    } catch (error) {
      console.error('Declaration reset failed:', error);
      throw error;
    }
  }

  /**
   * Test e-Deklaracje connection
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseURL}/test-connection`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Connection test failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Connection test failed:', error);
      throw error;
    }
  }

  /**
   * Get available signature methods for a company
   */
  async getSignatureMethods(companyId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/signature-methods/${companyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Signature methods retrieval failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Signature methods retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get error statistics for a company
   */
  async getErrorStatistics(companyId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/error-statistics/${companyId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error statistics retrieval failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error statistics retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string {
    // This would typically get the token from secure storage
    // For now, return a placeholder
    return 'mock-auth-token';
  }

  /**
   * Format UPO number for display
   */
  formatUPONumber(upoNumber: string): string {
    if (!upoNumber) return '';

    // UPO numbers are 32 characters, format them for better readability
    return `${upoNumber.substring(0, 8)}-${upoNumber.substring(8, 16)}-${upoNumber.substring(16, 24)}-${upoNumber.substring(24)}`;
  }

  /**
   * Get status color for UI display
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'draft':
        return '#6B7280'; // Gray
      case 'submitted':
      case 'processing':
        return '#F59E0B'; // Yellow
      case 'accepted':
        return '#10B981'; // Green
      case 'rejected':
        return '#EF4444'; // Red
      case 'failed':
        return '#DC2626'; // Dark red
      default:
        return '#6B7280'; // Gray
    }
  }

  /**
   * Get status description in Polish
   */
  getStatusDescription(status: string): string {
    switch (status) {
      case 'draft':
        return 'Szkic';
      case 'submitted':
        return 'Wysłane';
      case 'processing':
        return 'Przetwarzane';
      case 'accepted':
        return 'Zaakceptowane';
      case 'rejected':
        return 'Odrzucone';
      case 'failed':
        return 'Błędne';
      default:
        return 'Nieznany';
    }
  }

  /**
   * Check if declaration can be retried
   */
  canRetryDeclaration(status: string): boolean {
    return status === 'failed' || status === 'rejected';
  }

  /**
   * Get form code description
   */
  getFormDescription(formCode: string): string {
    switch (formCode) {
      case 'JPK_V7M':
        return 'JPK V7M (miesięczny)';
      case 'JPK_V7K':
        return 'JPK V7K (kwartalny)';
      case 'VAT-7':
        return 'VAT-7';
      case 'PIT-36':
        return 'PIT-36';
      case 'PIT-37':
        return 'PIT-37';
      case 'CIT-8':
        return 'CIT-8';
      case 'VAT-UE':
        return 'VAT-UE';
      default:
        return formCode;
    }
  }
}

export const eDeklaracjeService = new EDeklaracjeService();