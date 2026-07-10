import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';

// Async Thunks
export const loadProductsList = createAsyncThunk(
  'interaction/loadProducts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.interaction.listProducts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to load products list');
    }
  }
);

export const saveInteraction = createAsyncThunk(
  'interaction/save',
  async (interactionData, { rejectWithValue }) => {
    try {
      // Map doctor_feedback to feedback for the API schema
      const { doctor_feedback, ...rest } = interactionData;
      const apiPayload = {
        ...rest,
        feedback: doctor_feedback
      };
      const response = await api.interaction.create(apiPayload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to save interaction');
    }
  }
);

export const editInteraction = createAsyncThunk(
  'interaction/edit',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // Map doctor_feedback to feedback for the API schema
      const { doctor_feedback, ...rest } = data;
      const apiPayload = {
        ...rest,
      };
      if (doctor_feedback !== undefined) {
        apiPayload.feedback = doctor_feedback;
      }
      const response = await api.interaction.update(id, apiPayload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to update interaction');
    }
  }
);


export const fetchInteractionHistory = createAsyncThunk(
  'interaction/fetchHistory',
  async (hcpId, { rejectWithValue }) => {
    try {
      const response = await api.interaction.getHistory(hcpId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch history');
    }
  }
);

export const fetchGlobalInteractions = createAsyncThunk(
  'interaction/fetchGlobal',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.interaction.listAll();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch global interactions');
    }
  }
);

export const deleteInteraction = createAsyncThunk(
  'interaction/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.interaction.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete interaction');
    }
  }
);


// Initial empty form configuration
const defaultFormState = {
  id: null,
  hcp_id: '',
  doctor_name: '',
  hospital_name: '',
  meeting_date: new Date().toISOString().split('T')[0],
  meeting_time: new Date().toTimeString().slice(0, 5), // e.g. "14:30"
  meeting_type: 'In-Person',
  products_discussed: [],
  samples_distributed: {},
  doctor_feedback: '',
  outcome: '',
  follow_up_date: '',
  notes: '',
  summary: ''
};

const initialState = {
  form: { ...defaultFormState },
  productsList: [],
  history: [],
  loading: false,
  error: null,
  success: false
};

const interactionSlice = createSlice({
  name: 'interaction',
  initialState,
  reducers: {
    updateFormField: (state, action) => {
      const { field, value } = action.payload;
      state.form[field] = value;
    },
    toggleProductDiscussed: (state, action) => {
      const productName = action.payload;
      const index = state.form.products_discussed.indexOf(productName);
      if (index > -1) {
        state.form.products_discussed.splice(index, 1);
        // Also remove from samples if unchecked
        delete state.form.samples_distributed[productName];
      } else {
        state.form.products_discussed.push(productName);
      }
    },
    updateSampleQuantity: (state, action) => {
      const { productName, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.form.samples_distributed[productName];
      } else {
        state.form.samples_distributed[productName] = quantity;
      }
    },
    updateFormBulk: (state, action) => {
      // Merge AI extracted fields into current form state
      const updates = { ...action.payload };
      if (updates.feedback !== undefined) {
        updates.doctor_feedback = updates.feedback;
      }
      state.form = {
        ...state.form,
        ...updates
      };
    },
    setFormForEdit: (state, action) => {
      const visit = action.payload;
      state.form = {
        id: visit.id,
        hcp_id: visit.hcp_id,
        doctor_name: visit.doctor_name,
        hospital_name: visit.hospital_name,
        meeting_date: visit.meeting_date,
        meeting_time: visit.meeting_time,
        meeting_type: visit.meeting_type,
        products_discussed: [...visit.products_discussed],
        samples_distributed: { ...visit.samples_distributed },
        doctor_feedback: visit.feedback || visit.doctor_feedback || '',
        outcome: visit.outcome || '',
        follow_up_date: visit.follow_up_date || '',
        notes: visit.notes || '',
        summary: visit.summary || ''
      };
      state.success = false;
      state.error = null;
    },
    resetForm: (state) => {
      state.form = { ...defaultFormState };
      state.success = false;
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // loadProductsList
      .addCase(loadProductsList.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadProductsList.fulfilled, (state, action) => {
        state.loading = false;
        state.productsList = action.payload;
      })
      .addCase(loadProductsList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // saveInteraction
      .addCase(saveInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(saveInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.form = { ...defaultFormState }; // Reset form upon successful save
      })
      .addCase(saveInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // editInteraction
      .addCase(editInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(editInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        // Map feedback back to doctor_feedback for the form state
        const { feedback, ...rest } = action.payload;
        state.form = {
          ...rest,
          doctor_feedback: feedback || ''
        };
      })
      .addCase(editInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchInteractionHistory
      .addCase(fetchInteractionHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInteractionHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchInteractionHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchGlobalInteractions
      .addCase(fetchGlobalInteractions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGlobalInteractions.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchGlobalInteractions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteInteraction
      .addCase(deleteInteraction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteInteraction.fulfilled, (state, action) => {
        state.loading = false;
        state.history = state.history.filter((visit) => visit.id !== action.payload);
      })
      .addCase(deleteInteraction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  updateFormField, 
  toggleProductDiscussed, 
  updateSampleQuantity, 
  updateFormBulk, 
  setFormForEdit,
  resetForm,
  clearSuccess
} = interactionSlice.actions;

export default interactionSlice.reducer;
