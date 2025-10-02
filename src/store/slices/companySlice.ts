import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Company {
  id: string;
  name: string;
  nip: string;
  regon?: string;
  address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  vatStatus: 'active' | 'exempt' | 'inactive';
  taxOffice: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyState {
  companies: Company[];
  currentCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CompanyState = {
  companies: [],
  currentCompany: null,
  isLoading: false,
  error: null,
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload;
    },
    setCurrentCompany: (state, action: PayloadAction<Company | null>) => {
      state.currentCompany = action.payload;
    },
    addCompany: (state, action: PayloadAction<Company>) => {
      state.companies.push(action.payload);
    },
    updateCompany: (state, action: PayloadAction<Company>) => {
      const index = state.companies.findIndex(company => company.id === action.payload.id);
      if (index !== -1) {
        state.companies[index] = action.payload;
      }
      if (state.currentCompany?.id === action.payload.id) {
        state.currentCompany = action.payload;
      }
    },
    removeCompany: (state, action: PayloadAction<string>) => {
      state.companies = state.companies.filter(company => company.id !== action.payload);
      if (state.currentCompany?.id === action.payload) {
        state.currentCompany = null;
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setCompanies,
  setCurrentCompany,
  addCompany,
  updateCompany,
  removeCompany,
  setLoading,
  setError,
  clearError,
} = companySlice.actions;

export default companySlice.reducer;