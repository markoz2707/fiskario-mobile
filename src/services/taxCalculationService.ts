import {
  useCalculateMobileInvoiceMutation,
  usePreviewMobileInvoiceMutation,
  useValidateMobileInvoiceMutation,
} from '../store/api/apiSlice';
import { mobileErrorHandler, handleApiError } from './mobileErrorHandler';

export interface TaxCalculationItem {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate?: number;
  gtu?: string;
  category?: string;
}

export interface TaxCalculationRequest {
  companyId: string;
  items: TaxCalculationItem[];
  invoiceType?: 'VAT' | 'proforma' | 'correction';
  includeAllTaxes?: boolean;
  additionalData?: Record<string, any>;
}

export interface TaxCalculationResult {
  totalNet: number;
  totalVat: number;
  totalGross: number;
  vatBreakdown: VatBreakdown[];
  appliedRules: AppliedTaxRule[];
  message?: string;
  success: boolean;
  errorCode?: string;
}

export interface VatBreakdown {
  vatRate: number;
  netAmount: number;
  vatAmount: number;
  grossAmount: number;
  itemCount: number;
}

export interface AppliedTaxRule {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  amount?: number;
  description?: string;
}

class TaxCalculationService {
  private static instance: TaxCalculationService;

  static getInstance(): TaxCalculationService {
    if (!TaxCalculationService.instance) {
      TaxCalculationService.instance = new TaxCalculationService();
    }
    return TaxCalculationService.instance;
  }

  // Calculate taxes for invoice items
  async calculateTaxes(
    request: TaxCalculationRequest
  ): Promise<TaxCalculationResult> {
    try {
      // In a real implementation, this would use the RTK Query mutation
      // For now, we'll simulate the calculation with basic logic

      const vatBreakdown: VatBreakdown[] = [];
      const appliedRules: AppliedTaxRule[] = [];
      let totalNet = 0;
      let totalVat = 0;
      let totalGross = 0;

      // Group items by VAT rate
      const vatGroups = new Map<number, TaxCalculationItem[]>();

      for (const item of request.items) {
        const vatRate = item.vatRate || 23; // Default VAT rate
        if (!vatGroups.has(vatRate)) {
          vatGroups.set(vatRate, []);
        }
        vatGroups.get(vatRate)!.push(item);
      }

      // Calculate for each VAT rate group
      for (const [vatRate, items] of vatGroups.entries()) {
        let groupNetAmount = 0;
        let groupVatAmount = 0;
        let groupGrossAmount = 0;

        for (const item of items) {
          const itemNetAmount = item.quantity * item.unitPrice;
          const itemVatAmount = (itemNetAmount * vatRate) / 100;
          const itemGrossAmount = itemNetAmount + itemVatAmount;

          groupNetAmount += itemNetAmount;
          groupVatAmount += itemVatAmount;
          groupGrossAmount += itemGrossAmount;
        }

        vatBreakdown.push({
          vatRate,
          netAmount: groupNetAmount,
          vatAmount: groupVatAmount,
          grossAmount: groupGrossAmount,
          itemCount: items.length,
        });

        totalNet += groupNetAmount;
        totalVat += groupVatAmount;
        totalGross += groupGrossAmount;
      }

      // Apply tax rules (simplified)
      if (request.includeAllTaxes !== false) {
        appliedRules.push({
          ruleId: 'vat_standard',
          ruleName: 'Standard VAT',
          ruleType: 'vat',
          description: 'Standard VAT calculation applied',
        });
      }

      return {
        totalNet,
        totalVat,
        totalGross,
        vatBreakdown,
        appliedRules,
        success: true,
      };
    } catch (error) {
      return {
        totalNet: 0,
        totalVat: 0,
        totalGross: 0,
        vatBreakdown: [],
        appliedRules: [],
        success: false,
        errorCode: 'CALCULATION_ERROR',
        message: error instanceof Error ? error.message : 'Calculation failed',
      };
    }
  }

  // Preview invoice with tax calculations
  async previewInvoice(
    request: TaxCalculationRequest
  ): Promise<TaxCalculationResult> {
    try {
      const calculation = await this.calculateTaxes(request);

      if (!calculation.success) {
        return calculation;
      }

      // In a real implementation, this would call the preview API
      return {
        ...calculation,
        message: 'Invoice preview generated successfully',
      };
    } catch (error) {
      return {
        totalNet: 0,
        totalVat: 0,
        totalGross: 0,
        vatBreakdown: [],
        appliedRules: [],
        success: false,
        errorCode: 'PREVIEW_ERROR',
        message: 'Preview generation failed',
      };
    }
  }

  // Validate invoice data
  async validateInvoice(
    request: TaxCalculationRequest
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Basic validation
      if (!request.companyId) {
        errors.push('Company ID is required');
      }

      if (!request.items || request.items.length === 0) {
        errors.push('At least one item is required');
      }

      for (let i = 0; i < request.items.length; i++) {
        const item = request.items[i];

        if (!item.description?.trim()) {
          errors.push(`Item ${i + 1}: Description is required`);
        }

        if (!item.quantity || item.quantity <= 0) {
          errors.push(`Item ${i + 1}: Quantity must be greater than 0`);
        }

        if (!item.unitPrice || item.unitPrice < 0) {
          errors.push(`Item ${i + 1}: Unit price must be 0 or greater`);
        }

        if (item.vatRate !== undefined && (item.vatRate < 0 || item.vatRate > 100)) {
          errors.push(`Item ${i + 1}: VAT rate must be between 0 and 100`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      return {
        valid: false,
        errors: ['Validation failed due to internal error'],
      };
    }
  }

  // Get available VAT rates for company
  getAvailableVatRates(): number[] {
    return [0, 5, 8, 23]; // Standard Polish VAT rates
  }

  // Get GTU codes (Polish tax codes)
  getGtuCodes(): Array<{ code: string; description: string }> {
    return [
      { code: 'GTU_01', description: 'Dostawa napojów alkoholowych' },
      { code: 'GTU_02', description: 'Dostawa paliw' },
      { code: 'GTU_03', description: 'Dostawa oleju opałowego' },
      { code: 'GTU_04', description: 'Dostawa wyrobów tytoniowych' },
      { code: 'GTU_05', description: 'Dostawa odpadów' },
      { code: 'GTU_06', description: 'Dostawa urządzeń elektronicznych' },
      { code: 'GTU_07', description: 'Dostawa pojazdów' },
      { code: 'GTU_08', description: 'Dostawa metali szlachetnych' },
      { code: 'GTU_09', description: 'Dostawa leków' },
      { code: 'GTU_10', description: 'Dostawa budynków' },
      { code: 'GTU_11', description: 'Dostawa gruntów' },
      { code: 'GTU_12', description: 'Świadczenie usług o charakterze niematerialnym' },
      { code: 'GTU_13', description: 'Świadczenie usług transportowych' },
    ];
  }

  // Format currency amount for display
  formatCurrency(amount: number, currency: string = 'PLN'): string {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  // Calculate due date based on issue date and payment terms
  calculateDueDate(issueDate: Date, paymentTermsDays: number = 14): Date {
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + paymentTermsDays);
    return dueDate;
  }
}

export const taxCalculationService = TaxCalculationService.getInstance();
export default TaxCalculationService;