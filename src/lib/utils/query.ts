import type { QueryClient, QueryKey } from '@tanstack/svelte-query';

export const prefetchQuery =
    (queryClient: QueryClient) =>
    async <TKey extends QueryKey, TData>(options: {
        queryKey: TKey;
        queryFn: () => TData | Promise<TData>;
    }) => {
        if (queryClient.getQueryData(options.queryKey)) {
            const ret = options.queryFn();
            queryClient.setQueryData(
                options.queryKey as QueryKey,
                ret instanceof Promise ? await ret : ret
            );
        } else {
            await queryClient.prefetchQuery(options);
        }
    };
