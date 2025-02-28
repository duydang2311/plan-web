<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Button, RelativeTime } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
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
    <ol class="flex flex-wrap gap-2">
        {#if $query.data != null}
        {#each $query.data.items as { createdTime, name, path, totalProjects, totalUsers } (path)}
            <li class="flex-1 basis-96">
                <a
                    href="/{path}"
                    class="dark:bg-base-2 border-base-border-3 font-display text-medium hover:bg-base-3 hover:text-base-fg-1 block rounded-md border
                    px-6 py-4 transition duration-75 ease-out"
                >
                    <div class="flex items-end justify-between gap-16">
                        <div class="flex flex-col justify-between self-start">
                            <p
                                class="text-base-fg-1 font-display text-h4 flex items-center gap-2 font-bold"
                            >
                                {name}
                            </p>
                            <p class="c-label">
                                #{path} · created <RelativeTime time={createdTime} />.
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-4">
                            <div>
                                <p class="c-label text-xs uppercase tracking-tight">Members</p>
                                <p class="text-h2 font-bold">{totalUsers}</p>
                            </div>
                            <div>
                                <p class="c-label text-xs uppercase tracking-tight">Projects</p>
                                <p class="text-h2 font-bold">{totalProjects}</p>
                            </div>
                        </div>
                    </div>
                </a>
            </li>
        {/each}
        {/if}
        <li class="h-48 grow basis-full">
            <Button
                as="link"
                href="/new"
                outline
                filled={false}
                variant="base"
                class="flex size-full items-center justify-center gap-2 border-dashed px-12 py-4"
            >
                <IconPlus />
                Create workspace
            </Button>
        </li>
    </ol>
{/if}
