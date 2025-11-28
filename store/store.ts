import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tokenizerApi } from './api/tokenizer';
import { generationApi } from './api/generation';
import { dashboardApi } from './api/dashboard';
import { agentApi } from './api/agentApi';
import dashboardReducer from './dashboardSlice';

export const store = configureStore({
  reducer: {
    [tokenizerApi.reducerPath]: tokenizerApi.reducer,
    [generationApi.reducerPath]: generationApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [agentApi.reducerPath]: agentApi.reducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      tokenizerApi.middleware,
      generationApi.middleware,
      dashboardApi.middleware,
      agentApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;