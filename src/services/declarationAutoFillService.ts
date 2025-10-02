import { apiSlice } from '../store/api/apiSlice';

export interface AutoFillData {
  companyInfo: {
    name: string;
    nip: string;
    address: string;
  };
  vatRegisters: {
    sales: Array<{
      netAmount: number;
      vatAmount: number;
      vatRate: number;
    }>;
    purchases: Array<{
      netAmount: number;
      vatAmount: number;
      vatRate: number;
    }>;
  };
  previousDeclarations: Array<{
    type: string;
    period: string;
    data: any;
  }>;
}

export interface DeclarationFormData {
  type: 'VAT-7' | 'JPK_V7M' | 'JPK_V7K' | 'PIT-36' | 'CIT-8';
  period: string;
  variant?: 'M' | 'K';
  fields: Record<string, any>;
}

export class DeclarationAutoFillService {
  private static instance: DeclarationAutoFillService;

  public static getInstance(): DeclarationAutoFillService {
    if (!DeclarationAutoFillService.instance) {
      DeclarationAutoFillService.instance = new DeclarationAutoFillService();
    }
    return DeclarationAutoFillService.instance;
  }

  /**
   * Auto-fill VAT-7 declaration form
   */
  async autoFillVAT7(period: string, companyId: string): Promise<DeclarationFormData> {
    try {
      // Get VAT register data for the period
      const token = 'mock_token'; // This should be properly retrieved
      const vatRegistersResponse = await fetch(
        `http://localhost:3000/declarations/vat-register/${period}/${companyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!vatRegistersResponse.ok) {
        throw new Error('Failed to fetch VAT register data');
      }

      const vatRegistersData = await vatRegistersResponse.json();
      const registers = vatRegistersData.success ? vatRegistersData.data : [];

      // Calculate totals
      const sales = registers.filter((reg: any) => reg.type === 'sprzedaz');
      const purchases = registers.filter((reg: any) => reg.type === 'zakup');

      const totalSalesNet = sales.reduce((sum: number, reg: any) => sum + reg.netAmount, 0);
      const totalSalesVAT = sales.reduce((sum: number, reg: any) => sum + reg.vatAmount, 0);
      const totalPurchasesNet = purchases.reduce((sum: number, reg: any) => sum + reg.netAmount, 0);
      const totalPurchasesVAT = purchases.reduce((sum: number, reg: any) => sum + reg.vatAmount, 0);

      const vatDue = totalSalesVAT - totalPurchasesVAT;

      return {
        type: 'VAT-7',
        period,
        fields: {
          // P_10 - VAT należny (sales VAT)
          P_10: Math.round(totalSalesVAT),

          // P_11 - VAT naliczony (purchases VAT)
          P_11: Math.round(totalPurchasesVAT),

          // P_12 - VAT do zapłaty/zwrotu
          P_12: Math.round(vatDue),

          // P_15 - VAT do zapłaty (if positive)
          P_15: vatDue > 0 ? Math.round(vatDue) : 0,

          // P_16 - VAT do zwrotu (if negative)
          P_16: vatDue < 0 ? Math.round(Math.abs(vatDue)) : 0,

          // Additional calculated fields
          totalSalesNet,
          totalSalesVAT,
          totalPurchasesNet,
          totalPurchasesVAT,
          vatDue,

          // Auto-filled metadata
          autoFilled: true,
          autoFillDate: new Date().toISOString(),
          dataSource: 'vat_registers',
        }
      };
    } catch (error) {
      console.error('Error auto-filling VAT-7:', error);
      throw error;
    }
  }

  /**
   * Auto-fill JPK_V7M declaration form
   */
  async autoFillJPKV7M(period: string, companyId: string): Promise<DeclarationFormData> {
    try {
      // Get VAT register data for the period
      // Note: Token should be passed as parameter or retrieved from secure storage
      const token = 'mock_token'; // This should be properly retrieved
      const vatRegistersResponse = await fetch(
        `http://localhost:3000/declarations/vat-register/${period}/${companyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!vatRegistersResponse.ok) {
        throw new Error('Failed to fetch VAT register data');
      }

      const vatRegistersData = await vatRegistersResponse.json();
      const registers = vatRegistersData.success ? vatRegistersData.data : [];

      // Group by VAT rate
      const salesByRate = this.groupByVATRate(registers.filter((reg: any) => reg.type === 'sprzedaz'));
      const purchasesByRate = this.groupByVATRate(registers.filter((reg: any) => reg.type === 'zakup'));

      // Calculate totals
      const totalSalesNet = registers
        .filter((reg: any) => reg.type === 'sprzedaz')
        .reduce((sum: number, reg: any) => sum + reg.netAmount, 0);

      const totalSalesVAT = registers
        .filter((reg: any) => reg.type === 'sprzedaz')
        .reduce((sum: number, reg: any) => sum + reg.vatAmount, 0);

      const totalPurchasesNet = registers
        .filter((reg: any) => reg.type === 'zakup')
        .reduce((sum: number, reg: any) => sum + reg.netAmount, 0);

      const totalPurchasesVAT = registers
        .filter((reg: any) => reg.type === 'zakup')
        .reduce((sum: number, reg: any) => sum + reg.vatAmount, 0);

      const vatDue = totalSalesVAT - totalPurchasesVAT;

      return {
        type: 'JPK_V7M',
        period,
        variant: 'M',
        fields: {
          // Declaration part (VAT-7 section)
          P_10: Math.round(totalSalesVAT),
          P_11: Math.round(totalPurchasesVAT),
          P_12: Math.round(vatDue),
          P_15: vatDue > 0 ? Math.round(vatDue) : 0,
          P_16: vatDue < 0 ? Math.round(Math.abs(vatDue)) : 0,

          // Evidence part (VAT register section)
          salesByRate,
          purchasesByRate,
          vatRegisters: registers,

          // Summary
          totalSalesNet,
          totalSalesVAT,
          totalPurchasesNet,
          totalPurchasesVAT,
          vatDue,

          // Auto-filled metadata
          autoFilled: true,
          autoFillDate: new Date().toISOString(),
          dataSource: 'vat_registers',
        }
      };
    } catch (error) {
      console.error('Error auto-filling JPK_V7M:', error);
      throw error;
    }
  }

  /**
   * Auto-fill PIT-36 declaration form
   */
  async autoFillPIT36(period: string, companyId: string): Promise<DeclarationFormData> {
    try {
      // Get tax calculation data for the period
      const token = 'mock_token'; // This should be properly retrieved
      const calculationResponse = await fetch(
        `http://localhost:3000/declarations/calculate/pit-advance`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ period, companyId }),
        }
      );

      if (!calculationResponse.ok) {
        throw new Error('Failed to calculate PIT advance');
      }

      const calculationData = await calculationResponse.json();
      const calculation = calculationData.success ? calculationData.data : null;

      if (!calculation) {
        throw new Error('No calculation data available');
      }

      return {
        type: 'PIT-36',
        period,
        fields: {
          // P_1 - Dochód/Przychód
          P_1: Math.round(calculation.taxableIncome || 0),

          // P_2 - Podatek należny
          P_2: Math.round(calculation.taxDue || 0),

          // P_3 - Zaliczka do zapłaty
          P_3: Math.round(calculation.advanceToPay || 0),

          // Additional calculated fields
          taxableIncome: calculation.taxableIncome,
          taxBase: calculation.taxBase,
          taxDue: calculation.taxDue,
          previousAdvance: calculation.previousAdvance,
          advanceToPay: calculation.advanceToPay,

          // Auto-filled metadata
          autoFilled: true,
          autoFillDate: new Date().toISOString(),
          dataSource: 'tax_calculation',
        }
      };
    } catch (error) {
      console.error('Error auto-filling PIT-36:', error);
      throw error;
    }
  }

  /**
   * Auto-fill CIT-8 declaration form
   */
  async autoFillCIT8(period: string, companyId: string): Promise<DeclarationFormData> {
    try {
      // Get tax calculation data for the period
      const token = 'mock_token'; // This should be properly retrieved
      const calculationResponse = await fetch(
        `http://localhost:3000/declarations/calculate/cit`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ period, companyId }),
        }
      );

      if (!calculationResponse.ok) {
        throw new Error('Failed to calculate CIT');
      }

      const calculationData = await calculationResponse.json();
      const calculation = calculationData.success ? calculationData.data : null;

      if (!calculation) {
        throw new Error('No calculation data available');
      }

      return {
        type: 'CIT-8',
        period,
        fields: {
          // Main CIT fields
          dochód_przychód: Math.round(calculation.taxableIncome || 0),
          podstawa_opodatkowania: Math.round(calculation.taxBase || 0),
          podatek_należny: Math.round(calculation.taxDue || 0),

          // Additional calculated fields
          taxableIncome: calculation.taxableIncome,
          taxBase: calculation.taxBase,
          taxDue: calculation.taxDue,
          citRate: calculation.citRate,

          // Auto-filled metadata
          autoFilled: true,
          autoFillDate: new Date().toISOString(),
          dataSource: 'tax_calculation',
        }
      };
    } catch (error) {
      console.error('Error auto-filling CIT-8:', error);
      throw error;
    }
  }

  /**
   * Get auto-fill data for a specific period and declaration type
   */
  async getAutoFillData(
    declarationType: string,
    period: string,
    companyId: string
  ): Promise<AutoFillData> {
    try {
      // Get company information
      const companyInfo = {
        name: 'Company Name', // This would come from actual company data
        nip: '1234567890',
        address: 'Company Address',
      };

      // Get VAT registers for the period
      const token = 'mock_token'; // This should be properly retrieved
      const vatRegistersResponse = await fetch(
        `http://localhost:3000/declarations/vat-register/${period}/${companyId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      let vatRegisters = { sales: [], purchases: [] };

      if (vatRegistersResponse.ok) {
        const vatRegistersData = await vatRegistersResponse.json();
        const registers = vatRegistersData.success ? vatRegistersData.data : [];

        vatRegisters = {
          sales: registers.filter((reg: any) => reg.type === 'sprzedaz'),
          purchases: registers.filter((reg: any) => reg.type === 'zakup'),
        };
      }

      // Get previous declarations for reference
      const previousDeclarations: any[] = []; // This would fetch from API

      return {
        companyInfo,
        vatRegisters,
        previousDeclarations,
      };
    } catch (error) {
      console.error('Error getting auto-fill data:', error);
      throw error;
    }
  }

  /**
   * Validate auto-filled data
   */
  validateAutoFillData(formData: DeclarationFormData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields based on declaration type
    switch (formData.type) {
      case 'VAT-7':
      case 'JPK_V7M':
      case 'JPK_V7K':
        if (!formData.fields.P_10 && formData.fields.P_10 !== 0) {
          errors.push('VAT należny (P_10) jest wymagany');
        }
        if (!formData.fields.P_11 && formData.fields.P_11 !== 0) {
          errors.push('VAT naliczony (P_11) jest wymagany');
        }
        break;

      case 'PIT-36':
        if (!formData.fields.P_1 && formData.fields.P_1 !== 0) {
          errors.push('Dochód (P_1) jest wymagany');
        }
        if (!formData.fields.P_2 && formData.fields.P_2 !== 0) {
          errors.push('Podatek należny (P_2) jest wymagany');
        }
        break;

      case 'CIT-8':
        if (!formData.fields.dochód_przychód && formData.fields.dochód_przychód !== 0) {
          errors.push('Dochód/Przychód jest wymagany');
        }
        if (!formData.fields.podatek_należny && formData.fields.podatek_należny !== 0) {
          errors.push('Podatek należny jest wymagany');
        }
        break;
    }

    // Check for negative values where not allowed
    if (formData.fields.P_10 < 0) {
      errors.push('VAT należny nie może być ujemny');
    }
    if (formData.fields.P_11 < 0) {
      errors.push('VAT naliczony nie może być ujemny');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Helper method to group VAT registers by rate
   */
  private groupByVATRate(registers: any[]): Record<number, any> {
    return registers.reduce((groups: any, register: any) => {
      const rate = register.vatRate;
      if (!groups[rate]) {
        groups[rate] = {
          rate,
          netAmount: 0,
          vatAmount: 0,
          count: 0,
          entries: []
        };
      }

      groups[rate].netAmount += register.netAmount;
      groups[rate].vatAmount += register.vatAmount;
      groups[rate].count += 1;
      groups[rate].entries.push(register);

      return groups;
    }, {});
  }

  /**
   * Get suggested declaration type based on company data
   */
  getSuggestedDeclarationType(companyInfo: any): string {
    // Simple logic to suggest declaration type
    if (companyInfo.vatPayer) {
      return 'JPK_V7M'; // Default to monthly JPK
    } else if (companyInfo.taxForm === 'individual') {
      return 'PIT-36';
    } else {
      return 'CIT-8';
    }
  }

  /**
   * Get suggested period based on current date
   */
  getSuggestedPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    return `${year}-${month}`;
  }
}