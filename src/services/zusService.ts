import { apiSlice } from '../store/api/apiSlice';

export interface ZUSEmployee {
  id: string;
  firstName: string;
  lastName: string;
  pesel?: string;
  birthDate: string;
  address: string;
  phone?: string;
  email?: string;
  employmentDate: string;
  terminationDate?: string;
  insuranceStartDate: string;
  isOwner: boolean;
  contractType: 'employment' | 'mandate' | 'specific_task';
  salaryBasis: number;
  companyId: string;
}

export interface ZUSRegistration {
  id: string;
  formType: 'ZUA' | 'ZZA' | 'ZWUA';
  registrationDate: string;
  insuranceTypes: {
    emerytalna: boolean;
    rentowa: boolean;
    chorobowa: boolean;
    wypadkowa: boolean;
    zdrowotna: boolean;
  };
  contributionBasis: number;
  status: 'draft' | 'submitted' | 'confirmed' | 'cancelled';
  zusReferenceNumber?: string;
  upoNumber?: string;
  employeeId: string;
  companyId: string;
}

export interface ZUSReport {
  id: string;
  reportType: 'RCA' | 'RZA' | 'RSA' | 'DRA' | 'RPA';
  period: string;
  reportDate: string;
  totalEmployees: number;
  totalContributions: number;
  status: 'draft' | 'submitted' | 'confirmed' | 'corrected';
  zusReferenceNumber?: string;
  upoNumber?: string;
  companyId: string;
}

export interface ZUSContribution {
  id: string;
  period: string;
  contributionDate: string;
  emerytalnaEmployer: number;
  emerytalnaEmployee: number;
  rentowaEmployer: number;
  rentowaEmployee: number;
  chorobowaEmployee: number;
  wypadkowaEmployer: number;
  zdrowotnaEmployee: number;
  zdrowotnaDeductible: number;
  fpEmployee: number;
  fgspEmployee: number;
  basisEmerytalnaRentowa: number;
  basisChorobowa: number;
  basisZdrowotna: number;
  basisFPFGSP: number;
  zusFormType?: string;
  status: 'calculated' | 'submitted' | 'confirmed';
  employeeId?: string;
  companyId: string;
}

export interface ZUSSummary {
  totalEmployees: number;
  totalContributions: number;
  upcomingDeadlines: number;
  pendingSubmissions: number;
}

export interface ZUSDeadline {
  type: 'monthly_report' | 'annual_report' | 'registration';
  name: string;
  description: string;
  dueDate: string;
  period?: string;
  formTypes?: string[];
  isMandatory: boolean;
  companyId?: string;
  status: 'upcoming' | 'due' | 'overdue' | 'completed';
}

export const zusApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Employee Management
    getZUSEmployees: builder.query<ZUSEmployee[], string>({
      query: (companyId) => `/zus/employees?companyId=${companyId}`,
      providesTags: ['ZUSEmployees'],
    }),

    createZUSEmployee: builder.mutation<ZUSEmployee, Partial<ZUSEmployee>>({
      query: (employee) => ({
        url: '/zus/employees',
        method: 'POST',
        body: employee,
      }),
      invalidatesTags: ['ZUSEmployees'],
    }),

    updateZUSEmployee: builder.mutation<ZUSEmployee, { id: string; data: Partial<ZUSEmployee> }>({
      query: ({ id, data }) => ({
        url: `/zus/employees/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ZUSEmployees'],
    }),

    // Registration Management
    getZUSRegistrations: builder.query<ZUSRegistration[], string>({
      query: (companyId) => `/zus/registrations?companyId=${companyId}`,
      providesTags: ['ZUSRegistrations'],
    }),

    createZUSRegistration: builder.mutation<ZUSRegistration, Partial<ZUSRegistration>>({
      query: (registration) => ({
        url: '/zus/registrations',
        method: 'POST',
        body: registration,
      }),
      invalidatesTags: ['ZUSRegistrations'],
    }),

    // Report Management
    getZUSReports: builder.query<ZUSReport[], string>({
      query: (companyId) => `/zus/reports?companyId=${companyId}`,
      providesTags: ['ZUSReports'],
    }),

    createZUSReport: builder.mutation<ZUSReport, Partial<ZUSReport>>({
      query: (report) => ({
        url: '/zus/reports',
        method: 'POST',
        body: report,
      }),
      invalidatesTags: ['ZUSReports'],
    }),

    generateMonthlyReport: builder.mutation<any, { companyId: string; period: string }>({
      query: ({ companyId, period }) => ({
        url: `/zus/reports/generate-monthly?companyId=${companyId}&period=${period}`,
        method: 'POST',
      }),
      invalidatesTags: ['ZUSReports'],
    }),

    generateAnnualReport: builder.mutation<ZUSReport, { companyId: string; year: string }>({
      query: ({ companyId, year }) => ({
        url: `/zus/reports/generate-annual?companyId=${companyId}&year=${year}`,
        method: 'POST',
      }),
      invalidatesTags: ['ZUSReports'],
    }),

    // Contribution Management
    getZUSContributions: builder.query<ZUSContribution[], { companyId: string; period?: string }>({
      query: ({ companyId, period }) =>
        `/zus/contributions?companyId=${companyId}${period ? `&period=${period}` : ''}`,
      providesTags: ['ZUSContributions'],
    }),

    calculateEmployeeContributions: builder.mutation<ZUSContribution, {
      employeeId: string;
      period: string;
    }>({
      query: ({ employeeId, period }) => ({
        url: `/zus/contributions/calculate/${employeeId}?period=${period}`,
        method: 'POST',
      }),
      invalidatesTags: ['ZUSContributions'],
    }),

    // Deadline Management
    getZUSDeadlines: builder.query<ZUSDeadline[], string>({
      query: (companyId) => `/zus/deadlines?companyId=${companyId}`,
      providesTags: ['ZUSDeadlines'],
    }),

    getUpcomingDeadlines: builder.query<ZUSDeadline[], string>({
      query: (companyId) => `/zus/deadlines/upcoming?companyId=${companyId}`,
      providesTags: ['ZUSDeadlines'],
    }),

    // Summary/Dashboard Data
    getZUSSummary: builder.query<ZUSSummary, string>({
      query: (companyId) => `/zus/summary?companyId=${companyId}`,
      providesTags: ['ZUSSummary'],
    }),
  }),
});

export const {
  useGetZUSEmployeesQuery,
  useCreateZUSEmployeeMutation,
  useUpdateZUSEmployeeMutation,
  useGetZUSRegistrationsQuery,
  useCreateZUSRegistrationMutation,
  useGetZUSReportsQuery,
  useCreateZUSReportMutation,
  useGenerateMonthlyReportMutation,
  useGenerateAnnualReportMutation,
  useGetZUSContributionsQuery,
  useCalculateEmployeeContributionsMutation,
  useGetZUSDeadlinesQuery,
  useGetUpcomingDeadlinesQuery,
  useGetZUSSummaryQuery,
} = zusApi;

// Helper functions for local database operations
export class ZUSLocalService {
  static async saveEmployeeToLocalDB(employee: ZUSEmployee) {
    // Implementation for saving to WatermelonDB
    // This would use the ZUSEmployee model
  }

  static async saveRegistrationToLocalDB(registration: ZUSRegistration) {
    // Implementation for saving to WatermelonDB
    // This would use the ZUSRegistration model
  }

  static async saveReportToLocalDB(report: ZUSReport) {
    // Implementation for saving to WatermelonDB
    // This would use the ZUSReport model
  }

  static async saveContributionToLocalDB(contribution: ZUSContribution) {
    // Implementation for saving to WatermelonDB
    // This would use the ZUSContribution model
  }

  static async syncWithServer() {
    // Implementation for syncing local data with server
    // This would handle offline/online sync operations
  }
}