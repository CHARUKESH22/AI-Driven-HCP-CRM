import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from '../services/api';
import { updateFormBulk } from './interactionSlice';

export const sendChatMessage = createAsyncThunk(
  'chat/sendMessage',
  async (text, { getState, dispatch, rejectWithValue }) => {
    try {
      const state = getState();
      const sessionId = state.chat.sessionId;
      // Pass the current client-side form values so the AI knows what's already filled
      const currentFormState = state.interaction.form;

      const response = await api.chat.sendMessage(text, sessionId, currentFormState);
      const data = response.data;

      // Automatically sync AI-extracted parameters back to the Form state on the left
      if (data.extracted_form_fields && Object.keys(data.extracted_form_fields).length > 0) {
        dispatch(updateFormBulk(data.extracted_form_fields));
      }

      return {
        text: data.message,
        intent: data.intent
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail || 'AI Assistant is currently unavailable. Please fill the form manually.');
    }
  }
);

const initialState = {
  sessionId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
  messages: [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: "Hello! I am your AI CRM Assistant. Tell me naturally about your doctor visit (e.g., 'I met Dr. Ravi today. We discussed GlucoSafe and I gave 5 samples...'), and I'll log and populate the form for you.",
      timestamp: new Date().toLocaleTimeString().slice(0, 5),
      intent: 'Greeting'
    }
  ],
  loading: false,
  error: null
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addLocalUserMessage: (state, action) => {
      state.messages.push({
        id: `msg-${Date.now()}-user`,
        sender: 'user',
        text: action.payload,
        timestamp: new Date().toLocaleTimeString().slice(0, 5)
      });
    },
    clearChat: (state) => {
      state.messages = [initialState.messages[0]];
      state.sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({
          id: `msg-${Date.now()}-assistant`,
          sender: 'assistant',
          text: action.payload.text,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          intent: action.payload.intent
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.messages.push({
          id: `msg-${Date.now()}-error`,
          sender: 'assistant',
          text: `Error: ${action.payload}. Feel free to continue entering details manually on the left.`,
          timestamp: new Date().toLocaleTimeString().slice(0, 5),
          isError: true
        });
      });
  }
});

export const { addLocalUserMessage, clearChat } = chatSlice.actions;
export default chatSlice.reducer;
