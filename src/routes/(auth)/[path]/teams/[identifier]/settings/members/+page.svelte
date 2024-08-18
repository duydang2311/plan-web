<script lang="ts" context="module">
    declare global {
        namespace App {
            interface PageState {
                showInvitationDialog?: boolean;
            }
        }
    }
</script>

<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/stores';
    import clsx from 'clsx';
    import { Button, Icon } from '~/lib/components';
    import { none } from '~/lib/utils/transition';
    import { fluentSearchParams, queryParams } from '~/lib/utils/url';
    import type { ActionData, PageData } from './$types';
    import AllMembers from './AllMembers.svelte';
    import InvitationDialog from './InvitationDialog.svelte';
    import PendingMembers from './PendingMembers.svelte';

    let { data, form }: { data: PageData; form: ActionData } = $props();
    const params = $derived(queryParams($page.url, { show: '' }));

    function handleInvite() {
        replaceState('', { ...$page.state, showInvitationDialog: true });
    }
</script>

{#if $page.state.showInvitationDialog}
    <div out:none={{ duration: 200 }}>
        <InvitationDialog
            team={data.team}
            {form}
            defaultOpen={true}
            onClose={() => {
                replaceState('', { ...$page.state, showInvitationDialog: false });
            }}
        />
    </div>
{/if}
<main class="h-full flex flex-col divide divide-y divide-base-border">
    <div class="px-8 py-2 flex gap-4 justify-between items-center whitespace-nowrap">
        <div>
            <h1 class="sr-only">Manage team members</h1>
            <div class="flex gap-4">
                <Button
                    as="link"
                    href={fluentSearchParams($page.url).delete('show').toString()}
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
                    href={fluentSearchParams($page.url).set('show', 'pending').toString()}
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
                class="flex gap-4 items-center"
                onclick={handleInvite}
            >
                <Icon name="user-plus" class="size-4" />
                <span>Invite member</span>
            </Button>
        </div>
    </div>
    <div class="mx-auto grow overflow-auto">
        {#if params.show === 'pending'}
            <PendingMembers {data} />
        {:else}
            <AllMembers {data} />
        {/if}
    </div>
</main>
