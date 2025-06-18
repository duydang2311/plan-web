<script lang="ts" module>
    declare global {
        namespace App {
            interface PageState {
                showSearchWorkspaceItemsDialog?: boolean;
            }
        }
    }
</script>

<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { omit } from '@baetheus/fun/record';
    import { toStore } from 'svelte/store';
    import { Button, DialogBuilder, Field, Input, Label } from '~/lib/components';
    import {
        IconKeyCommandOutline,
        IconProjectOutline,
        IconSearch,
        IconTaskOutline
    } from '~/lib/components/icons';
    import { dialog, tsap } from '~/lib/utils/transition';
    import SearchWorkspaceItemsContent from './SearchWorkspaceItemsContent.svelte';

    const { workspaceId }: { workspaceId: string } = $props();

    let open = $derived(page.state.showSearchWorkspaceItemsDialog === true);
    let search = $state.raw('');
</script>

<Button
    variant="base"
    outline
    class="flex items-center gap-2 px-2 text-sm"
    onclick={() => {
        replaceState('', {
            ...page.state,
            showSearchWorkspaceItemsDialog: true
        });
    }}
>
    <IconSearch class="text-base-fg-5" />
    Search
    <div
        class="text-base-fg-1 bg-base-5 ml-auto flex select-none items-center gap-0 rounded-sm px-1"
    >
        <IconKeyCommandOutline />
        <span class="font-display">K</span>
    </div>
</Button>
<DialogBuilder
    options={{
        open: toStore(
            () => open,
            (a) => {
                if (a) {
                    replaceState('', {
                        ...page.state,
                        showSearchWorkspaceItemsDialog: true
                    });
                } else {
                    replaceState('', omit('showSearchWorkspaceItemsDialog')(page.state));
                }
            }
        )
    }}
>
    {#snippet children(builder)}
        <div
            in:tsap={dialog.overlayIn()}
            out:tsap={dialog.overlayOut()}
            {...builder.overlay}
            use:builder.overlay.action
            class="c-dialog--overlay"
        ></div>
        <div
            in:tsap={dialog.in()}
            out:tsap={dialog.out()}
            {...builder.content}
            use:builder.content.action
            class="c-dialog--wrapper"
        >
            <div class="c-dialog">
                <div class="flex items-center justify-between">
                    <h2 {...builder.title} use:builder.title.action class="font-h-bold capitalize">
                        Search workspace
                    </h2>
                    <IconSearch class="text-base-fg-1 size-10" />
                </div>
                <p {...builder.description} use:builder.description.action class="text-pretty">
                    Use the search bar below to find projects, tasks, or teams within your
                    workspace.
                </p>
                <div class="mt-4">
                    <Field>
                        <Label for="search-workspace-items">Search by project, task or team</Label>
                        <div class="relative">
                            <IconSearch
                                class="text-base-fg-5 absolute left-2 top-1/2 -translate-y-1/2"
                            />
                            <Input
                                type="search"
                                id="search-workspace-items"
                                placeholder="Search items within workspace"
                                class="w-full rounded-b-none pl-8"
                                bind:value={search}
                            />
                        </div>
                    </Field>
                    <div
                        class="border-base-border-3 h-52 w-full overflow-auto rounded-b-md border border-t-0"
                    >
                        <SearchWorkspaceItemsContent {workspaceId} {search}>
                            {#snippet children(resource)}
                                {#if resource.current == null}
                                    {#if resource.loading}
                                        <div class="p-2">
                                            <span class="c-text-secondary">Searching items...</span>
                                        </div>
                                    {:else if search.length > 0}
                                        <div class="p-2">
                                            <span class="c-text-secondary">No items found.</span>
                                        </div>
                                    {/if}
                                {:else if resource.current.items.length === 0}
                                    <div class="p-2">
                                        <span class="c-text-secondary">No items found.</span>
                                    </div>
                                {:else}
                                    <ol class="grid grid-cols-[auto_1fr]" class:animate-pulse={resource.loading}>
                                        {#each resource.current.items as item (item.item.id)}
                                            <li
                                                class="hover:bg-base-3 relative col-span-full grid grid-cols-subgrid items-center gap-2 p-2 transition"
                                            >
                                                {#if item.kind === 0}
                                                    <a
                                                        href="/{page.params.path}/projects/{item.item
                                                            .identifier}"
                                                        aria-label="What"
                                                        class="absolute inset-0"
                                                    ></a>
                                                    <IconProjectOutline />
                                                    <span class="c-text-primary">
                                                        {item.item.name}
                                                    </span>
                                                {:else if item.kind === 1}
                                                    <a
                                                        href="/{page.params.path}/projects/{item.item.project
                                                            .identifier}/issues/{item.item
                                                            .orderNumber}"
                                                        aria-label="What"
                                                        class="absolute inset-0"
                                                    ></a>
                                                    <IconTaskOutline />
                                                    <span class="c-text-primary"
                                                        >{item.item.title}</span
                                                    >
                                                {/if}
                                            </li>
                                        {/each}
                                    </ol>
                                {/if}
                            {/snippet}
                        </SearchWorkspaceItemsContent>
                    </div>
                </div>
            </div>
        </div>
    {/snippet}
</DialogBuilder>
