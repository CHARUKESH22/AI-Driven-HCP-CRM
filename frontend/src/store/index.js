import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import hcpReducer from './hcpSlice';
import interactionReducer from './interactionSlice';
import chatReducer from './chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hcp: hcpReducer,
    interaction: interactionReducer,
    chat: chatReducer,
  },
  // Disable serializable checks for date/time objects if needed, but we keep defaults safe
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
