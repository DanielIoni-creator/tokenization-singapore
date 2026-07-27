import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import thunk from 'redux-thunk';
import authReducer from './authSlice';
import tokenReducer from './tokenSlice';
import orderReducer from './orderSlice';
import portfolioReducer from './portfolioSlice';
import notificationReducer from './notificationSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'portfolio', 'tokens', 'orders'],
  blacklist: ['notifications'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  tokens: tokenReducer,
  orders: orderReducer,
  portfolio: portfolioReducer,
  notifications: notificationReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: [thunk],
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
