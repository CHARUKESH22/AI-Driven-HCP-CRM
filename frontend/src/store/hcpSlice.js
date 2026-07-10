import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

export const searchHCPs = createAsyncThunk(
  'hcp/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await api.hcp.search(query);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to search HCPs');
    }
  }
);

export const loadHCPList = createAsyncThunk(
  'hcp/loadList',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.hcp.list();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to retrieve HCP list');
    }
  }
);

export const createHCP = createAsyncThunk(
  'hcp/create',
  async (hcpData, { rejectWithValue }) => {
    try {
      const response = await api.hcp.create(hcpData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to register HCP');
    }
  }
);

const initialState = {
  searchResults: [],
  allHCPs: [],
  selectedHCP: null,
  loading: false,
  error: null
};

const hcpSlice = createSlice({
  name: 'hcp',
  initialState,
  reducers: {
    selectHCP: (state, action) => {
      state.selectedHCP = action.payload;
    },
    clearSelectedHCP: (state) => {
      state.selectedHCP = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // searchHCPs
      .addCase(searchHCPs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchHCPs.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchHCPs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // loadHCPList
      .addCase(loadHCPList.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadHCPList.fulfilled, (state, action) => {
        state.loading = false;
        state.allHCPs = action.payload;
      })
      .addCase(loadHCPList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createHCP
      .addCase(createHCP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createHCP.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = [action.payload, ...state.searchResults];
        state.allHCPs = [
          {
            id: action.payload.id,
            full_name: action.payload.doctor_name,
            doctor_name: action.payload.doctor_name,
            hospital_name: action.payload.hospital,
            hospital: action.payload.hospital,
            specialization: action.payload.specialization
          },
          ...state.allHCPs
        ];
      })
      .addCase(createHCP.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { selectHCP, clearSelectedHCP } = hcpSlice.actions;
export default hcpSlice.reducer;
