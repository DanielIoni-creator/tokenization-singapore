import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import portfolioService from '../services/portfolioService';

export const getPortfolio = createAsyncThunk(
  'portfolio/getPortfolio',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPortfolio();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const getPerformance = createAsyncThunk(
  'portfolio/getPerformance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await portfolioService.getPerformance();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  portfolio: null,
  performance: null,
  isLoading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPortfolio.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPortfolio.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolio = action.payload.data;
      })
      .addCase(getPortfolio.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(getPerformance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getPerformance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.performance = action.payload.data;
      })
      .addCase(getPerformance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = portfolioSlice.actions;
export default portfolioSlice.reducer;
