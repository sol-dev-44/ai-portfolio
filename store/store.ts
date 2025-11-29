import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tokenizerApi } from './api/tokenizer';
import { generationApi } from './api/generation';
import { dashboardApi } from './api/dashboard';
import { agentApi } from './api/agentApi';
import { lsatApi } from './api/lsatApi';
import dashboardReducer from './dashboardSlice';
import lsatReducer from './lsatSlice';
import contractReducer from './contractSlice';
import { contractApi } from './api/contractApi';

export const store = configureStore({
  reducer: {
    [tokenizerApi.reducerPath]: tokenizerApi.reducer,
    [generationApi.reducerPath]: generationApi.reducer,
    [dashboardApi.reducerPath]: dashboardApi.reducer,
    [agentApi.reducerPath]: agentApi.reducer,
    [lsatApi.reducerPath]: lsatApi.reducer,
    [contractApi.reducerPath]: contractApi.reducer,
    dashboard: dashboardReducer,
    lsat: lsatReducer,
    contract: contractReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      tokenizerApi.middleware,
      generationApi.middleware,
      dashboardApi.middleware,
      agentApi.middleware,
      lsatApi.middleware,
      contractApi.middleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;