import { apiSlice } from '../store/api/apiSlice';

export interface InvoiceOcrRequest {
  imageBase64: string;
  mimeType?: string;
  userId?: string;
  companyId?: string;
}

export interface InvoiceOcrResponse {
  requestId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: {
    invoiceNumber?: string;
    issueDate?: string;
    saleDate?: string;
    dueDate?: string;
    type?: 'VAT' | 'PROFORMA' | 'CORRECTIVE' | 'RECEIPT';
    seller?: {
      name?: string;
      address?: string;
      nip?: string;
      phone?: string;
      email?: string;
    };
    buyer?: {
      name?: string;
      address?: string;
      nip?: string;
      phone?: string;
      email?: string;
    };
    items?: Array<{
      name: string;
      quantity: number;
      unitPrice: number;
      vatRate?: number;
      totalPrice: number;
    }>;
    netAmount?: number;
    vatAmount?: number;
    grossAmount?: number;
    currency?: string;
    paymentMethod?: string;
    description?: string;
    overallConfidence: 'LOW' | 'MEDIUM' | 'HIGH';
    confidenceScore?: number;
    processingNotes?: string;
    rawText?: string;
  };
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface TextOcrRequest {
  ocrText: string;
  userId?: string;
  companyId?: string;
}

export const ocrApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /**
     * Process invoice image with OCR and LLM
     */
    processInvoiceImage: builder.mutation<InvoiceOcrResponse, InvoiceOcrRequest>({
      query: (request) => {
        const formData = new FormData();

        // Convert base64 to blob for file upload
        const byteCharacters = atob(request.imageBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: request.mimeType || 'image/jpeg' });

        formData.append('invoiceImage', blob, 'invoice.jpg');

        if (request.userId) {
          formData.append('userId', request.userId);
        }

        if (request.companyId) {
          formData.append('companyId', request.companyId);
        }

        return {
          url: '/ocr-llm-proxy/process-invoice',
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      transformResponse: (response: InvoiceOcrResponse) => response,
      transformErrorResponse: (error: any) => {
        console.error('OCR processing error:', error);
        return {
          error: error.data?.message || 'Failed to process invoice image',
          status: error.status,
        };
      },
    }),

    /**
     * Process OCR text with LLM (for manual text input or corrections)
     */
    processOcrText: builder.mutation<InvoiceOcrResponse, TextOcrRequest>({
      query: (request) => ({
        url: '/ocr-llm-proxy/process-text',
        method: 'POST',
        body: {
          ocrText: request.ocrText,
          userId: request.userId,
          companyId: request.companyId,
        },
      }),
      transformResponse: (response: InvoiceOcrResponse) => response,
      transformErrorResponse: (error: any) => {
        console.error('Text processing error:', error);
        return {
          error: error.data?.message || 'Failed to process OCR text',
          status: error.status,
        };
      },
    }),

    /**
     * Get processing status (for async processing if implemented)
     */
    getProcessingStatus: builder.query<InvoiceOcrResponse, { requestId: string }>({
      query: (params) => ({
        url: '/ocr-llm-proxy/status',
        method: 'POST',
        body: params,
      }),
      transformResponse: (response: InvoiceOcrResponse) => response,
    }),
  }),
});

export const {
  useProcessInvoiceImageMutation,
  useProcessOcrTextMutation,
  useGetProcessingStatusQuery,
} = ocrApiSlice;

/**
 * Privacy-compliant image processing utilities
 */
export class PrivacyCompliantOcrService {
  /**
   * Convert image to base64 with privacy considerations
   */
  static async imageToBase64(imageUri: string): Promise<string> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Remove data URL prefix to get just base64
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Validate image for processing (size, format, etc.)
   */
  static validateImage(imageUri: string, maxSizeMB: number = 10): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fetch(imageUri)
        .then(response => {
          const contentLength = response.headers.get('content-length');
          if (contentLength && parseInt(contentLength) > maxSizeMB * 1024 * 1024) {
            resolve(false);
            return;
          }

          return response.blob();
        })
        .then(blob => {
          if (!blob) {
            resolve(false);
            return;
          }

          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
          resolve(allowedTypes.includes(blob.type));
        })
        .catch(error => {
          console.error('Error validating image:', error);
          resolve(false);
        });
    });
  }

  /**
   * Create processing log entry (for debugging without sensitive data)
   */
  static createProcessingLog(
    operation: string,
    metadata: {
      imageSize?: number;
      processingTime?: number;
      confidence?: number;
      hasSensitiveData?: boolean;
      error?: string;
    }
  ) {
    const timestamp = new Date().toISOString();

    return {
      timestamp,
      operation,
      metadata,
      // Note: No sensitive data should be logged here
      // All sensitive data is masked by the backend service
    };
  }

  /**
   * Handle GDPR consent for OCR processing
   */
  static async requestOcrConsent(): Promise<boolean> {
    // In a real implementation, this would show a consent dialog
    // For now, return true (assuming consent was given)
    return new Promise((resolve) => {
      // Mock consent request
      setTimeout(() => {
        resolve(true);
      }, 500);
    });
  }

  /**
   * Anonymize processing data for local storage/logging
   */
  static anonymizeProcessingData(data: any): any {
    if (!data) return data;

    const anonymized = { ...data };

    // Remove or mask potentially sensitive fields
    const sensitiveFields = ['rawText', 'seller', 'buyer'];

    sensitiveFields.forEach(field => {
      if (anonymized[field]) {
        if (typeof anonymized[field] === 'string') {
          // Basic anonymization - replace with generic text
          anonymized[field] = '[ANONYMIZED]';
        } else if (typeof anonymized[field] === 'object') {
          // For objects, keep structure but anonymize values
          Object.keys(anonymized[field]).forEach(key => {
            if (['nip', 'phone', 'email', 'address'].includes(key)) {
              anonymized[field][key] = '[ANONYMIZED]';
            }
          });
        }
      }
    });

    return anonymized;
  }
}

/**
 * OCR Processing Hook with Privacy Compliance
 */
export const usePrivacyCompliantOcr = () => {
  const [processInvoiceImage] = useProcessInvoiceImageMutation();
  const [processOcrText] = useProcessOcrTextMutation();

  const processInvoiceWithPrivacy = async (
    imageUri: string,
    options?: {
      userId?: string;
      companyId?: string;
      skipConsent?: boolean;
    }
  ) => {
    try {
      // Request consent if not skipped
      if (!options?.skipConsent) {
        const hasConsent = await PrivacyCompliantOcrService.requestOcrConsent();
        if (!hasConsent) {
          throw new Error('OCR processing consent required');
        }
      }

      // Validate image
      const isValid = await PrivacyCompliantOcrService.validateImage(imageUri);
      if (!isValid) {
        throw new Error('Invalid image file');
      }

      // Convert to base64
      const base64 = await PrivacyCompliantOcrService.imageToBase64(imageUri);

      // Process with backend
      const result = await processInvoiceImage({
        imageBase64: base64,
        mimeType: 'image/jpeg',
        userId: options?.userId,
        companyId: options?.companyId,
      });

      // Create processing log
      PrivacyCompliantOcrService.createProcessingLog('INVOICE_OCR_COMPLETED', {
        confidence: result.data?.result?.confidenceScore,
        hasSensitiveData: !!result.data?.result?.rawText,
      });

      return result;
    } catch (error: any) {
      // Log error without sensitive data
      PrivacyCompliantOcrService.createProcessingLog('INVOICE_OCR_ERROR', {
        error: error.message,
      });

      throw error;
    }
  };

  const processTextWithPrivacy = async (
    ocrText: string,
    options?: {
      userId?: string;
      companyId?: string;
      skipConsent?: boolean;
    }
  ) => {
    try {
      // Request consent if not skipped
      if (!options?.skipConsent) {
        const hasConsent = await PrivacyCompliantOcrService.requestOcrConsent();
        if (!hasConsent) {
          throw new Error('OCR processing consent required');
        }
      }

      // Process with backend
      const result = await processOcrText({
        ocrText,
        userId: options?.userId,
        companyId: options?.companyId,
      });

      // Create processing log
      PrivacyCompliantOcrService.createProcessingLog('TEXT_OCR_COMPLETED', {
        confidence: result.data?.result?.confidenceScore,
      });

      return result;
    } catch (error: any) {
      // Log error without sensitive data
      PrivacyCompliantOcrService.createProcessingLog('TEXT_OCR_ERROR', {
        error: error.message,
      });

      throw error;
    }
  };

  return {
    processInvoiceWithPrivacy,
    processTextWithPrivacy,
  };
};