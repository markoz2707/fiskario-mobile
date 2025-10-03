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
        params,
      }),
      providesTags: ['Invoice'],
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
  useAuthenticateKSeFMutation,
  useGetKSeFStatusQuery,
  useSubmitInvoiceToKSeFMutation,
  useCheckKSeFInvoiceStatusQuery,
  useGetKSeFUPOQuery,
} = apiSlice;