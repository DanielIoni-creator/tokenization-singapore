import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import tokenService from '../services/tokenService';

export const getTokens = createAsyncThunk(
  'tokens/getTokens',
  async (params, { rejectWithValue }) => {
    try {
      const response = await tokenService.getTokens(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getTokenById = createAsyncThunk(
  'tokens/getTokenById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tokenService.getTokenById(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getTokenStats = createAsyncThunk(
  'tokens/getTokenStats',
  async (id, { rejectWithValue }) => {
    try {
      const response = await tokenService.getTokenStats(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  currentToken: null,
  stats: null,
  isLoading: false,
  error: null,
};

const tokenSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {
    clearCurrentToken: (state) => {
      state.currentToken = null;
      state.stats = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTokens.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTokens.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data;
      })
      .addCase(getTokens.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getTokenById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTokenById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentToken = action.payload.data;
      })
      .addCase(getTokenById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getTokenStats.fulfilled, (state, action) => {
        state.stats = action.payload.data;
      });
  },
});

export const { clearCurrentToken, clearError } = tokenSlice.actions;
export default tokenSlice.reducer;
