import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from '../config';

export interface ReceivedInvoice {
    id: string;
    ksefInvoiceNumber: string;
    number: string;
    date: string;
    sellerName: string;
    sellerNip: string;
    totalGross: number;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    currency: string;
}

export interface InvoiceDetails extends ReceivedInvoice {
    dueDate?: string;
    sellerAddress: string;
    totalNet: number;
    totalVat: number;
    items: InvoiceItem[];
}

export interface InvoiceItem {
    name: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    grossAmount: number;
}

export interface SyncResponse {
    totalFound: number;
    newInvoices: number;
    updatedInvoices: number;
    invoiceNumbers: string[];
    syncTimestamp: string;
}

class KSeFService {
    private axiosInstance: AxiosInstance;

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Add auth token interceptor
        this.axiosInstance.interceptors.request.use(
            async (config) => {
                // Get token from storage (implement based on your auth system)
                // const token = await getAuthToken();
                // if (token) {
                //   config.headers.Authorization = `Bearer ${token}`;
                // }
                return config;
            },
            (error) => Promise.reject(error),
        );
    }

    /**
     * Get list of received invoices with optional filtering
     */
    async getReceivedInvoices(
        filter: 'all' | 'pending' | 'approved' | 'rejected' = 'all',
    ): Promise<ReceivedInvoice[]> {
        try {
            const response = await this.axiosInstance.get('/invoicing/received', {
                params: {
                    filter: filter !== 'all' ? filter : undefined,
                },
            });
            return response.data;
        } catch (error) {
            console.error('Failed to get received invoices:', error);
            throw new Error('Nie udało się pobrać faktur');
        }
    }

    /**
     * Get detailed invoice data
     */
    async getInvoiceDetails(invoiceId: string): Promise<InvoiceDetails> {
        try {
            const response = await this.axiosInstance.get(`/invoicing/received/${invoiceId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to get invoice details:', error);
            throw new Error('Nie udało się pobrać szczegółów faktury');
        }
    }

    /**
     * Synchronize invoices from KSeF
     */
    async syncInvoices(
        dateFrom?: Date,
        dateTo?: Date,
        forceSync: boolean = false,
    ): Promise<SyncResponse> {
        try {
            const response = await this.axiosInstance.post('/ksef/invoices/sync', {
                dateFrom: dateFrom?.toISOString(),
                dateTo: dateTo?.toISOString(),
                forceSync,
            });
            return response.data;
        } catch (error) {
            console.error('Failed to sync invoices:', error);
            throw new Error('Nie udało się zsynchronizować faktur');
        }
    }

    /**
     * Approve invoice
     */
    async approveInvoice(invoiceId: string, notes?: string): Promise<void> {
        try {
            await this.axiosInstance.post(`/ksef/invoices/${invoiceId}/approve`, {
                notes,
            });
        } catch (error) {
            console.error('Failed to approve invoice:', error);
            throw new Error('Nie udało się zatwierdzić faktury');
        }
    }

    /**
     * Reject invoice
     */
    async rejectInvoice(invoiceId: string, reason: string): Promise<void> {
        try {
            await this.axiosInstance.post(`/ksef/invoices/${invoiceId}/reject`, {
                reason,
            });
        } catch (error) {
            console.error('Failed to reject invoice:', error);
            throw new Error('Nie udało się odrzucić faktury');
        }
    }

    /**
     * Get sync statistics
     */
    async getSyncStatistics(): Promise<{
        lastSyncTime: string | null;
        totalInvoicesThisWeek: number;
        pendingApprovals: number;
    }> {
        try {
            const response = await this.axiosInstance.get('/ksef/sync/statistics');
            return response.data;
        } catch (error) {
            console.error('Failed to get sync statistics:', error);
            return {
                lastSyncTime: null,
                totalInvoicesThisWeek: 0,
                pendingApprovals: 0,
            };
        }
    }

    /**
     * Download invoice PDF
     */
    async downloadInvoicePDF(invoiceId: string): Promise<string> {
        try {
            const response = await this.axiosInstance.get(
                `/invoicing/received/${invoiceId}/pdf`,
                {
                    responseType: 'blob',
                },
            );

            // Convert blob to base64 or file URL
            const blob = response.data;
            const fileURL = URL.createObjectURL(blob);
            return fileURL;
        } catch (error) {
            console.error('Failed to download invoice PDF:', error);
            throw new Error('Nie udało się pobrać PDF faktury');
        }
    }

    /**
     * Download invoice XML
     */
    async downloadInvoiceXML(invoiceId: string): Promise<string> {
        try {
            const response = await this.axiosInstance.get(
                `/invoicing/received/${invoiceId}/xml`,
            );
            return response.data;
        } catch (error) {
            console.error('Failed to download invoice XML:', error);
            throw new Error('Nie udało się pobrać XML faktury');
        }
    }

    /**
     * Get KSeF connection status
     */
    async getKSeFStatus(): Promise<{
        authenticated: boolean;
        environment?: string;
        expiresAt?: string;
    }> {
        try {
            const response = await this.axiosInstance.get('/ksef/status');
            return response.data;
        } catch (error) {
            console.error('Failed to get KSeF status:', error);
            return { authenticated: false };
        }
    }
}

export const ksefService = new KSeFService();
