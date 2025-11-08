import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootState } from '../index';
import { API_BASE_URL } from '../../config';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: async (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth?.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
      'Auth',
      'Company',
      'Invoice',
      'Declaration',
      'Report',
      'Notification',
      'User',
      'TaxRules',
      'ZUSEmployees',
      'ZUSRegistrations',
      'ZUSReports',
      'ZUSContributions',
      'ZUSDeadlines',
      'ZUSSummary',
      'Dashboard',
      'Workflow',
     ],
  endpoints: (builder) => ({
    // Auth endpoints
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: { username: credentials.email, password: credentials.password },
      }),
      invalidatesTags: ['Auth'],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['Auth'],
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),

    // Company endpoints
    getCompanies: builder.query({
      query: () => '/companies',
      providesTags: ['Company'],
    }),
    createCompany: builder.mutation({
      query: (companyData) => ({
        url: '/companies',
        method: 'POST',
        body: companyData,
      }),
      invalidatesTags: ['Company'],
    }),
    updateCompany: builder.mutation({
      query: ({ id, ...companyData }) => ({
        url: `/companies/${id}`,
        method: 'PUT',
        body: companyData,
      }),
      invalidatesTags: ['Company'],
    }),

    // Invoice endpoints
    getInvoices: builder.query({
      query: (params) => ({
        url: '/invoices',
        params: {
          ...params,
          page: params.page || 1,
          limit: params.limit || 20,
        },
      }),
      providesTags: ['Invoice'],
      serializeQueryArgs: ({ queryArgs }) => {
        // Remove pagination params from cache key to enable proper pagination
        const { page, ...baseArgs } = queryArgs;
        return baseArgs;
      },
      merge: (currentCache, newItems, { arg }) => {
        if (arg.page && arg.page > 1) {
          // If loading additional pages, merge with existing data
          return {
            ...currentCache,
            invoices: [...(currentCache.invoices || []), ...(newItems.invoices || [])],
          };
        }
        // For first page or refresh, replace entirely
        return newItems;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        // Force refetch when page changes or other params change
        return currentArg?.page !== previousArg?.page ||
               currentArg?.companyId !== previousArg?.companyId;
      },
    }),
    createInvoice: builder.mutation({
      query: (invoiceData) => ({
        url: '/invoices',
        method: 'POST',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoice'],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...invoiceData }) => ({
        url: `/invoices/${id}`,
        method: 'PUT',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoice'],
    }),

    // Enhanced Mobile Invoice endpoints
    calculateMobileInvoice: builder.mutation({
      query: (calculationData) => ({
        url: '/invoicing/mobile/calculate',
        method: 'POST',
        body: calculationData,
      }),
    }),
    previewMobileInvoice: builder.mutation({
      query: (calculationData) => ({
        url: '/invoicing/mobile/preview',
        method: 'POST',
        body: calculationData,
      }),
    }),
    validateMobileInvoice: builder.mutation({
      query: (calculationData) => ({
        url: '/invoicing/mobile/validate',
        method: 'POST',
        body: calculationData,
      }),
    }),
    getMobileInvoiceTemplates: builder.query({
      query: (companyId) => `/invoicing/mobile/templates/${companyId}`,
      providesTags: ['Invoice'],
    }),

    // Mobile Sync endpoints
    performFullSync: builder.mutation({
      query: (syncData) => ({
        url: '/mobile-sync/full-sync',
        method: 'POST',
        body: syncData,
      }),
    }),
    performIncrementalSync: builder.mutation({
      query: (syncData) => ({
        url: '/mobile-sync/incremental-sync',
        method: 'POST',
        body: syncData,
      }),
    }),
    getSyncStatus: builder.query({
      query: (deviceId) => `/mobile-sync/status/${deviceId}`,
    }),
    resolveSyncConflict: builder.mutation({
      query: (conflictData) => ({
        url: '/mobile-sync/resolve-conflict',
        method: 'POST',
        body: conflictData,
      }),
    }),
    getPendingChanges: builder.query({
      query: ({ companyId, since }) => ({
        url: `/mobile-sync/pending-changes/${companyId}`,
        params: { since },
      }),
    }),
    forceSync: builder.mutation({
      query: (syncData) => ({
        url: '/mobile-sync/force-sync',
        method: 'POST',
        body: syncData,
      }),
    }),

    // KSeF endpoints
    authenticateKSeF: builder.mutation({
      query: (authData) => ({
        url: '/ksef/authenticate',
        method: 'POST',
        body: authData,
      }),
    }),
    getKSeFStatus: builder.query({
      query: () => '/ksef/status',
    }),
    submitInvoiceToKSeF: builder.mutation({
      query: (invoiceData) => ({
        url: '/ksef/invoice/submit',
        method: 'POST',
        body: invoiceData,
      }),
      invalidatesTags: ['Invoice'],
    }),
    checkKSeFInvoiceStatus: builder.query({
      query: (referenceNumber) => `/ksef/invoice/${referenceNumber}/status`,
      providesTags: ['Invoice'],
    }),
    getKSeFUPO: builder.query({
      query: (referenceNumber) => `/ksef/invoice/${referenceNumber}/upo`,
    }),

    // Declaration endpoints
    getDeclarations: builder.query({
      query: (params) => ({
        url: '/declarations',
        params,
      }),
      providesTags: ['Declaration'],
    }),
    submitDeclaration: builder.mutation({
      query: (declarationData) => ({
        url: '/declarations/submit',
        method: 'POST',
        body: declarationData,
      }),
      invalidatesTags: ['Declaration'],
    }),

    // Report endpoints
    getReports: builder.query({
      query: (params) => ({
        url: '/reports',
        params,
      }),
      providesTags: ['Report'],
    }),

    // Notification endpoints
    getNotifications: builder.query({
      query: () => '/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (notificationId) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),

    // Deadline management endpoints
    getDeadlines: builder.query({
      query: (params) => ({
        url: '/notifications/deadlines',
        params,
      }),
      providesTags: ['Notification'],
    }),
    calculateDeadlines: builder.mutation({
      query: () => ({
        url: '/notifications/deadlines/calculate',
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
    markDeadlineCompleted: builder.mutation({
      query: (deadlineId) => ({
        url: `/notifications/deadlines/${deadlineId}/complete`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
    getDeadlineComplianceReport: builder.query({
      query: ({ startDate, endDate }) => ({
        url: '/notifications/deadlines/compliance-report',
        params: { startDate, endDate },
      }),
      providesTags: ['Notification'],
    }),
    getDeadlineHistory: builder.query({
      query: (params) => ({
        url: '/notifications/deadlines/history',
        params,
      }),
      providesTags: ['Notification'],
    }),

    // Tax Rules endpoints
    getTaxForms: builder.query({
      query: () => '/tax-rules/tax-forms',
      providesTags: ['TaxRules'],
    }),
    createTaxForm: builder.mutation({
      query: (taxFormData) => ({
        url: '/tax-rules/tax-forms',
        method: 'POST',
        body: taxFormData,
      }),
      invalidatesTags: ['TaxRules'],
    }),
    getTaxFormById: builder.query({
      query: (id) => `/tax-rules/tax-forms/${id}`,
      providesTags: ['TaxRules'],
    }),
    createTaxRule: builder.mutation({
      query: (taxRuleData) => ({
        url: '/tax-rules/tax-rules',
        method: 'POST',
        body: taxRuleData,
      }),
      invalidatesTags: ['TaxRules'],
    }),
    getTaxRulesByForm: builder.query({
      query: (taxFormId) => `/tax-rules/tax-forms/${taxFormId}/rules`,
      providesTags: ['TaxRules'],
    }),
    createCompanyTaxSettings: builder.mutation({
      query: (settingsData) => ({
        url: '/tax-rules/company-settings',
        method: 'POST',
        body: settingsData,
      }),
      invalidatesTags: ['TaxRules'],
    }),
    getCompanyTaxSettings: builder.query({
      query: (companyId) => `/tax-rules/companies/${companyId}/settings`,
      providesTags: ['TaxRules'],
    }),
    updateCompanyTaxSettings: builder.mutation({
      query: ({ companyId, taxFormId, isSelected }) => ({
        url: `/tax-rules/companies/${companyId}/tax-forms/${taxFormId}`,
        method: 'PATCH',
        body: { isSelected },
      }),
      invalidatesTags: ['TaxRules'],
    }),
    updateBulkCompanyTaxSettings: builder.mutation({
      query: (settingsData) => ({
        url: '/tax-rules/company-settings',
        method: 'PUT',
        body: settingsData,
      }),
      invalidatesTags: ['TaxRules'],
    }),

    // Management Dashboard endpoints
    getDashboardSummary: builder.query({
      query: (filters) => ({
        url: '/management-dashboard/summary',
        params: filters,
      }),
      providesTags: ['Dashboard'],
    }),
    getRealTimeStatus: builder.query({
      query: () => '/management-dashboard/real-time-status',
      providesTags: ['Dashboard'],
    }),
    getRecentActivities: builder.query({
      query: (filters) => ({
        url: '/management-dashboard/activities',
        params: filters,
      }),
      providesTags: ['Dashboard'],
    }),
    getUpcomingDeadlines: builder.query({
      query: (filters) => ({
        url: '/management-dashboard/deadlines',
        params: filters,
      }),
      providesTags: ['Dashboard'],
    }),
    getDashboardMetrics: builder.query({
      query: (filters) => ({
        url: '/management-dashboard/metrics',
        params: filters,
      }),
      providesTags: ['Dashboard'],
    }),

    // Workflow Automation endpoints
    getWorkflows: builder.query({
      query: (params) => ({
        url: '/workflow-automation/workflows',
        params,
      }),
      providesTags: ['Workflow'],
    }),
    createWorkflow: builder.mutation({
      query: (workflowData) => ({
        url: '/workflow-automation/workflows',
        method: 'POST',
        body: workflowData,
      }),
      invalidatesTags: ['Workflow'],
    }),
    getWorkflowById: builder.query({
      query: ({ workflowId, tenantId }) => ({
        url: `/workflow-automation/workflows/${workflowId}`,
        params: { tenantId },
      }),
      providesTags: ['Workflow'],
    }),
    cancelWorkflow: builder.mutation({
      query: ({ workflowId, tenantId }) => ({
        url: `/workflow-automation/workflows/${workflowId}/cancel`,
        method: 'PUT',
        params: { tenantId },
      }),
      invalidatesTags: ['Workflow'],
    }),
    executeWorkflowStep: builder.mutation({
      query: (executionData) => ({
        url: `/workflow-automation/workflows/${executionData.workflowId}/execute`,
        method: 'POST',
        body: executionData,
      }),
      invalidatesTags: ['Workflow'],
    }),
    getWorkflowTemplates: builder.query({
      query: (params) => ({
        url: '/workflow-automation/templates',
        params,
      }),
      providesTags: ['Workflow'],
    }),
    getDefaultWorkflowTemplates: builder.query({
      query: () => '/workflow-automation/templates/default',
      providesTags: ['Workflow'],
    }),
    createWorkflowTemplate: builder.mutation({
      query: ({ templateData, tenantId }) => ({
        url: '/workflow-automation/templates',
        method: 'POST',
        body: templateData,
        params: { tenantId },
      }),
      invalidatesTags: ['Workflow'],
    }),
    getSmartDefaults: builder.query({
      query: (smartDefaultsData) => ({
        url: '/workflow-automation/smart-defaults',
        method: 'POST',
        body: smartDefaultsData,
      }),
      providesTags: ['Workflow'],
    }),
    getWorkflowTypes: builder.query({
      query: () => '/workflow-automation/workflow-types',
      providesTags: ['Workflow'],
    }),
    getWorkflowDefinition: builder.query({
      query: (type) => `/workflow-automation/workflow-definitions/${type}`,
      providesTags: ['Workflow'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRefreshTokenMutation,
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useUpdateCompanyMutation,
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useGetDeclarationsQuery,
  useSubmitDeclarationMutation,
  useGetReportsQuery,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useGetDeadlinesQuery,
  useCalculateDeadlinesMutation,
  useMarkDeadlineCompletedMutation,
  useGetDeadlineComplianceReportQuery,
  useGetDeadlineHistoryQuery,
  useAuthenticateKSeFMutation,
  useGetKSeFStatusQuery,
  useSubmitInvoiceToKSeFMutation,
  useCheckKSeFInvoiceStatusQuery,
  useGetKSeFUPOQuery,
  useGetTaxFormsQuery,
  useCreateTaxFormMutation,
  useGetTaxFormByIdQuery,
  useCreateTaxRuleMutation,
  useGetTaxRulesByFormQuery,
  useCreateCompanyTaxSettingsMutation,
  useGetCompanyTaxSettingsQuery,
  useUpdateCompanyTaxSettingsMutation,
  useUpdateBulkCompanyTaxSettingsMutation,
  // Enhanced Mobile Invoice hooks
  useCalculateMobileInvoiceMutation,
  usePreviewMobileInvoiceMutation,
  useValidateMobileInvoiceMutation,
  useGetMobileInvoiceTemplatesQuery,
  // Mobile Sync hooks
  usePerformFullSyncMutation,
  usePerformIncrementalSyncMutation,
  useGetSyncStatusQuery,
  useResolveSyncConflictMutation,
  useGetPendingChangesQuery,
  useForceSyncMutation,
  // Management Dashboard hooks
  useGetDashboardSummaryQuery,
  useGetRealTimeStatusQuery,
  useGetRecentActivitiesQuery,
  useGetUpcomingDeadlinesQuery,
  useGetDashboardMetricsQuery,
  // Workflow Automation hooks
  useGetWorkflowsQuery,
  useCreateWorkflowMutation,
  useGetWorkflowByIdQuery,
  useCancelWorkflowMutation,
  useExecuteWorkflowStepMutation,
  useGetWorkflowTemplatesQuery,
  useGetDefaultWorkflowTemplatesQuery,
  useCreateWorkflowTemplateMutation,
  useGetSmartDefaultsQuery,
  useGetWorkflowTypesQuery,
  useGetWorkflowDefinitionQuery,
} = apiSlice;