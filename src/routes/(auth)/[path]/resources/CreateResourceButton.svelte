<script lang="ts" module>
    declare global {
        namespace App {
            interface PageState {
                showCreateResourceDialog?: boolean;
            }
        }
    }
</script>

<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { Button, DialogBuilder } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { UserPreset } from '~/lib/models/user';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import { dialog, tsap } from '~/lib/utils/transition';
    import type { LocalWorkspaceResource } from './+page.server';
    import CreateResourceForm from './CreateResourceForm.svelte';

    const {
        workspaceId,
        resourceListRef,
        user
    }: {
        workspaceId: string;
        resourceListRef: Ref<PaginatedList<LocalWorkspaceResource> | undefined>;
        user: UserPreset['basicProfile'];
    } = $props();

    const open = writable(page.state.showCreateResourceDialog ?? false);
</script>

<div>
    <Button
        variant="primary"
        class="border-base-border-3 flex content-center items-center gap-4 text-nowrap border"
        title="Create a new resource"
        onclick={() => {
            $open = true;
            replaceState('', { ...page.state, showCreateResourceDialog: true });
        }}
    >
        <IconPlus />
        Create Resource
    </Button>

    <DialogBuilder
        options={{
            open,
            forceVisible: true,
            onOpenChange: ({ next }) => {
                if (next) {
                    replaceState('', { ...page.state, showCreateResourceDialog: true });
                } else {
                    const { showCreateResourceDialog, ...rest } = page.state;
                    replaceState('', rest);
                }
                return next;
            }
        }}
    >
        {#snippet children(builder)}
            <div
                transition:fade={{ duration: 150 }}
                class="c-dialog--overlay"
                {...builder.overlay}
                use:builder.overlay.action
            ></div>
            <div
                class="c-dialog--wrapper"
                {...builder.content}
                use:builder.content.action
                in:tsap={dialog.in()}
                out:tsap={dialog.out()}
            >
                <div class="c-dialog">
                    <CreateResourceForm {workspaceId} {resourceListRef} {user} />
                </div>
            </div>
        {/snippet}
    </DialogBuilder>
</div>
