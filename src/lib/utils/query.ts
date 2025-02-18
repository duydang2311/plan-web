import type { QueryClient } from '@tanstack/svelte-query';

export const prefetchQuery =
    (queryClient: QueryClient) =>
    (queryKey: readonly unknown[], queryFn: () => MaybePromise<unknown>) => {
        queryClient.prefetchQuery({
            queryKey,
            queryFn
        });
    };

export const QueryResponse = {
    Fetch: async (f: () => Promise<Response>) => {
        try {
            return await f();
        } catch (e) {
            throw new Error(
                `There was an unknown error while fetching resources (code: fetch). Logs: ${e}.`,
                { cause: e }
            );
        }
    },
    HTTP: async (f: () => Promise<Response>) => {
        const response = await QueryResponse.Fetch(f);
        if (!response.ok) {
            QueryResponse.HTTPError(response);
        }
        return response;
    },
    HTTPError: (response: Response) => {
        if (!response.ok) {
            throw new Error(`${response.statusText} (code: ${response.status})`);
        }
        return response;
    },
    JSON: async <T>(f: () => Promise<T>) => {
        try {
            return await f();
        } catch (e) {
            throw new Error(
                `There was an error while deserializing JSON (code: JSON). Logs: ${e}.`,
                { cause: e }
            );
        }
    }
};
