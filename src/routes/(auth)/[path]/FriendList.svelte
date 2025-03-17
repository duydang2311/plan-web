<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { Asset } from '~/lib/models/asset';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { QueryResponse } from '~/lib/utils/query';

    const { userId }: { userId: string } = $props();
    const { api } = useRuntime();
    const select =
        'CreatedTime,Friend.Email,Friend.Profile.Name,Friend.Profile.DisplayName,Friend.Profile.Image';
    const query = createQuery(
        toStore(() => ({
            queryKey: [
                'user-friends',
                {
                    userId,
                    params: {
                        select
                    }
                }
            ],
            queryFn: async () => {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const response = await QueryResponse.HTTP(() =>
                    api.get(`user-friends/${userId}`, { query: { select } })
                );
                return await QueryResponse.JSON(() =>
                    response.json<
                        PaginatedList<{
                            friend: {
                                email: string;
                                profile?: {
                                    name: string;
                                    displayName: string;
                                    image: Partial<Asset>;
                                };
                            };
                        }>
                    >()
                );
            }
        }))
    );
</script>

<div>
    {#if $query.isLoading}
        Loading...
    {:else if $query.data == null || $query.data.items.length === 0}
        <span class="c-label">No friends found.</span>
    {:else}
        {JSON.stringify($query.data)}
    {/if}
</div>
