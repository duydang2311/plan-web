<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Button, RelativeTime } from '~/lib/components';
    import { IconPlus, IconProjectOutline, IconUsers } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { QueryResponse } from '~/lib/utils/query';
    import { createWorkspaceListParams, type LocalWorkspace } from './utils';

    interface Props {
        userId: string;
    }

    const { userId }: Props = $props();
    const { api } = useRuntime();
    const query = createQuery(
        toStore(() => ({
            queryKey: ['workspaces', { userId }],
            queryFn: async () => {
                const response = await QueryResponse.HTTP(() =>
                    api.get('workspaces', {
                        query: createWorkspaceListParams(userId)
                    })
                );
                return await QueryResponse.JSON(() =>
                    response.json<PaginatedList<LocalWorkspace>>()
                );
            }
        }))
    );
</script>

{#if $query.isPending}
    Loading...
{:else if $query.error}
    {$query.error.toString()}
{:else}
    <ol class="grid grid-cols-[repeat(auto-fit,minmax(24rem,1fr))] items-stretch gap-2">
        {#if $query.data != null}
            {#each $query.data.items as { createdTime, name, path, totalProjects, totalUsers } (path)}
                <li class="flex-1 basis-96">
                    <a
                        href="/{path}"
                        class="dark:bg-base-2 border-base-border-3 font-display text-medium hover:bg-base-3 hover:text-base-fg-1 block h-full rounded-md
                    border px-6 py-4 transition duration-75 ease-out"
                    >
                        <div class="flex items-end justify-between gap-16">
                            <div class="flex flex-col justify-between self-start">
                                <p
                                    class="text-base-fg-1 font-display text-h4 font-h-bold flex items-center gap-2"
                                >
                                    {name}
                                </p>
                                <p class="c-text-secondary">
                                    #{path}
                                </p>
                            </div>
                        </div>
                        <div class="c-text-secondary mt-8 flex flex-wrap gap-4">
                            <div class="flex items-center gap-2 font-medium">
                                <IconUsers />
                                <p>{totalUsers} members</p>
                            </div>
                            <div class="flex items-center gap-2 font-medium">
                                <IconProjectOutline />
                                <p>{totalProjects} projects</p>
                            </div>
                            <div class="ml-auto">
                                created <RelativeTime time={createdTime} />
                            </div>
                        </div>
                    </a>
                </li>
            {/each}
        {/if}
    </ol>
{/if}
