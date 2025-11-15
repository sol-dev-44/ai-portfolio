import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { tokenizerApi} from './api/tokenizer';
import { llmApi } from './api/llm';

export const store = configureStore({
  reducer: {
    [tokenizerApi.reducerPath]: tokenizerApi.reducer,
    [llmApi.reducerPath]: llmApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware()
      .concat(tokenizerApi.middleware)
      .concat(llmApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;