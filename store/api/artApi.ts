import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ArtParameters } from '../artSlice';

export const artApi = createApi({
    reducerPath: 'artApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
    endpoints: (builder) => ({
        interpretPrompt: builder.mutation<ArtParameters, string>({
            query: (prompt) => ({
                url: '/interpret-prompt',
                method: 'POST',
                body: { prompt },
            }),
        }),
    }),
});

export const { useInterpretPromptMutation } = artApi;
