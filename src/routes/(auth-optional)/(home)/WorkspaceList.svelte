<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { createWorkspaceListParams } from './utils';
    import { GenericError, HttpError } from '~/lib/models/errors';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { LocalWorkspace } from './+page.server';
    import { Button, Icon } from '~/lib/components';
    import { QueryResponse } from '~/lib/utils/query';

    interface Props {
        userId: string;
    }

    const { userId }: Props = $props();
    const { api } = useRuntime();
    const query = createQuery<PaginatedList<LocalWorkspace>, Error | GenericError | HttpError>(
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
    No entries.
{:else}
    <ol class="flex flex-wrap gap-2">
        {#each $query.data.items as { name, path } (path)}
            <li>
                <a
                    href="/{path}"
                    class="block px-12 py-4 dark:bg-base-2 border border-base-border-3 rounded-md
                    transition duration-75 ease-out hover:bg-base-3 hover:text-base-fg-1"
                >
                    <p class="font-medium">{name}</p>
                </a>
            </li>
        {/each}
        <li>
            <Button
                as="link"
                href="/new"
                filled={false}
                variant="base"
                class="h-full flex items-center gap-2 px-12 py-4 text-base-fg-4"
            >
                <Icon name="plus" />
                Create workspace
            </Button>
        </li>
    </ol>
{/if}
