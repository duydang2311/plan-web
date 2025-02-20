<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import clsx from 'clsx';
    import { Button } from '~/lib/components';
    import { IconUserPlus } from '~/lib/components/icons';
    import { none } from '~/lib/utils/transition';
    import { fluentSearchParams, queryParams } from '~/lib/utils/url';
    import type { ActionData, PageData } from './$types';
    import AllMembers from './AllMembers.svelte';
    import InvitationDialog from './InvitationDialog.svelte';
    import PendingMembers from './PendingMembers.svelte';

    let { data, form }: { data: PageData; form: ActionData } = $props();
    const params = $derived(queryParams(page.url, { show: '' }));

    function handleInvite() {
        replaceState('', { ...page.state, showInvitationDialog: true });
    }
</script>

{#if page.state.showInvitationDialog}
    <div out:none={{ duration: 200 }}>
        <InvitationDialog
            team={data.team}
            {form}
            options={{
                defaultOpen: true,
                onOpenChange: ({ next }) => {
                    if (next === false) {
                        replaceState('', { ...page.state, showInvitationDialog: false });
                    }
                    return next;
                }
            }}
        />
    </div>
{/if}
<main class="divide divide-base-border-2 flex h-full flex-col divide-y">
    <div class="flex items-center justify-between gap-4 whitespace-nowrap px-8 py-2">
        <div>
            <h1 class="sr-only">Manage team members</h1>
            <div class="flex gap-4">
                <Button
                    as="link"
                    href={fluentSearchParams(page.url).delete('show').toString()}
                    variant="base"
                    outline
                    size="sm"
                    class={clsx(
                        'w-fit',
                        params.show !== 'pending' ? 'bg-base-3' : 'text-base-fg-ghost'
                    )}
                >
                    All members
                </Button>
                <Button
                    as="link"
                    href={fluentSearchParams(page.url).set('show', 'pending').toString()}
                    variant="base"
                    outline
                    size="sm"
                    class={clsx(
                        'w-fit',
                        params.show === 'pending' ? 'bg-base-3' : 'text-base-fg-ghost'
                    )}
                >
                    Pending members
                </Button>
            </div>
        </div>
        <div>
            <Button
                variant="base"
                outline
                size="sm"
                class="flex items-center gap-4"
                onclick={handleInvite}
            >
                <IconUserPlus class="size-4" />
                <span>Invite member</span>
            </Button>
        </div>
    </div>
    <div class="grow overflow-auto">
        {#if params.show === 'pending'}
            <PendingMembers {data} />
        {:else}
            <AllMembers {data} />
        {/if}
    </div>
</main>
