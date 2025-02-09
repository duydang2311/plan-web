<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Button, Icon, RelativeTime } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { GenericError, HttpError } from '~/lib/models/errors';
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
{:else if $query.data == null || $query.data.items.length === 0}
    <p class="c-label">No workspaces found.</p>
{:else}
    <ol class="flex flex-wrap gap-2">
        {#each $query.data.items as { createdTime, name, path, totalProjects, totalUsers } (path)}
            <li class="flex-1 basis-96">
                <a
                    href="/{path}"
                    class="block px-6 py-4 dark:bg-base-2 border border-base-border-3 rounded-md font-display text-medium
                    transition duration-75 ease-out hover:bg-base-3 hover:text-base-fg-1"
                >
                    <div class="flex items-end justify-between gap-16">
                        <div class="flex flex-col justify-between self-start">
                            <p
                                class="flex items-center gap-2 text-base-fg-1 font-bold font-display text-h4"
                            >
                                {name}
                            </p>
                            <p class="c-label">
                                #{path} · created <RelativeTime time={createdTime} />.
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-4">
                            <div>
                                <p class="c-label uppercase tracking-tight text-xs">Members</p>
                                <p class="text-h2 font-bold">{totalUsers}</p>
                            </div>
                            <div>
                                <p class="c-label uppercase tracking-tight text-xs">Projects</p>
                                <p class="text-h2 font-bold">{totalProjects}</p>
                            </div>
                        </div>
                    </div>
                </a>
            </li>
        {/each}
        <li class="basis-full grow h-48">
            <Button
                as="link"
                href="/new"
                outline
                filled={false}
                variant="base"
                class="size-full flex justify-center items-center gap-2 px-12 py-4 border-dashed"
            >
                <Icon name="plus" />
                Create workspace
            </Button>
        </li>
    </ol>
{/if}
