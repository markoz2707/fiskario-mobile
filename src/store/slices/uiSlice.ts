import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  language: 'pl' | 'en';
  isOnline: boolean;
  isLoading: boolean;
  notifications: {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  };
  modals: {
    [key: string]: boolean;
  };
}

const initialState: UIState = {
  theme: 'system',
  language: 'pl',
  isOnline: true,
  isLoading: false,
  notifications: {
    show: false,
    type: 'info',
    message: '',
  },
  modals: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<'pl' | 'en'>) => {
      state.language = action.payload;
    },
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    showNotification: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
    }>) => {
      state.notifications = {
        show: true,
        type: action.payload.type,
        message: action.payload.message,
      };
    },
    hideNotification: (state) => {
      state.notifications.show = false;
    },
    showModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = true;
    },
    hideModal: (state, action: PayloadAction<string>) => {
      state.modals[action.payload] = false;
    },
    hideAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    },
  },
});

export const {
  setTheme,
  setLanguage,
  setOnlineStatus,
  setLoading,
  showNotification,
  hideNotification,
  showModal,
  hideModal,
  hideAllModals,
} = uiSlice.actions;

export default uiSlice.reducer;