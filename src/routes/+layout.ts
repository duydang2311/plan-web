import { browser } from '$app/environment';
import { QueryClient } from '@tanstack/svelte-query';
import type { LayoutLoad } from './$types';
import { HttpError } from '~/lib/models/plain_errors';

export const load: LayoutLoad = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                enabled: browser,
                staleTime: 60 * 1000,
                experimental_prefetchInRender: true,
                retry: (failureCount, error) => {
                    if (failureCount > 3) {
                        return false;
                    }

                    if (error instanceof HttpError) {
                        return error.status >= 500 || error.status === 429;
                    }

                    return error.name === 'TypeError' || error.name === 'AbortError';
                },
                retryDelay: (failureCount, error) => {
                    if (error instanceof HttpError && error.status === 429) {
                        return Math.min(15000 * 2 ** failureCount, 60000);
                    }
                    return Math.min(1000 * 2 ** failureCount, 30000);
                }
            }
        }
    });

    return { queryClient };
};
