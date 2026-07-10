import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: {
    id: "rep-101",
    name: "John Doe",
    email: "john.doe@biopharma.com",
    role: "Senior Medical Representative",
    territory: "North Region",
    company: "PharmaCorp Global"
  },
  token: "mock-jwt-token-12345",
  isAuthenticated: true,
  loading: false,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    }
  }
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
