<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { createWorkspaceListParams } from './utils';
    import { GenericError, HttpError } from '~/lib/models/errors';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { LocalWorkspace } from './+page.server';
    import { Button, Icon } from '~/lib/components';

    interface Props {
        userId: string;
    }

    const { userId }: Props = $props();
    const { api } = useRuntime();
    const query = createQuery<PaginatedList<LocalWorkspace>, Error | GenericError | HttpError>(
        toStore(() => ({
            queryKey: ['workspaces', { userId }],
            queryFn: async () => {
                console.log(createWorkspaceListParams(userId));
                const response = await api
                    .get('workspaces', {
                        query: createWorkspaceListParams(userId)
                    })
                    .catch((e) => {
                        throw new Error(
                            `There was an unknown error while fetching workspaces (code: fetch).\n${e}`,
                            { cause: e }
                        );
                    });
                if (!response.ok) {
                    throw new Error(`${response.statusText} (code: ${response.status}).`);
                }
                return await response.json<PaginatedList<LocalWorkspace>>();
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
                    class="block px-8 py-4 dark:bg-base-2 border border-base-border-3 rounded-md
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
                class="h-full flex items-center gap-2 px-8 py-4"
            >
                <Icon name="plus" />
                Create workspace
            </Button>
        </li>
    </ol>
{/if}
