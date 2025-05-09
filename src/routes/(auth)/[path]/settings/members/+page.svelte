<script lang="ts">
    import { writable } from 'svelte/store';
    import { Button, Main, Tabs } from '~/lib/components';
    import { IconEnvelopeOutline, IconUserPlus, IconUsers } from '~/lib/components/icons';
    import { permissions } from '~/lib/models/permission';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { ActionData, PageData } from './$types';
    import ActiveMembers from './ActiveMembers.svelte';
    import InviteMemberDialog from './InviteMemberDialog.svelte';
    import PendingMembers from './PendingMembers.svelte';
    import { page } from '$app/state';
    import { fluentSearchParams } from '~/lib/utils/url';
    import { goto } from '$app/navigation';

    const { data }: { data: PageData } = $props();
    const showInviteMember = writable(false);
    const workspacePermissionsRef = createRef.maybePromise(() => data.workspacePermissions);
    const can = $derived({
        invite: workspacePermissionsRef.value?.has(permissions.createWorkspaceInvitation) ?? false,
        deleteMember:
            workspacePermissionsRef.value?.has(permissions.deleteWorkspaceMember) ?? false,
        deleteInvitation:
            workspacePermissionsRef.value?.has(permissions.deleteWorkspaceInvitation) ?? false
    });
    const invitationListRef = createRef.maybePromise(() => data.invitationList);

    const tabsBuilder = new Tabs.Builder({
        value: () => (page.url.searchParams.get('view') === 'pending' ? 'pending' : 'active'),
        onValueChange: async (a) => {
            const params = fluentSearchParams(page.url);
            if (a === 'active') {
                page.url.searchParams.delete('view');
            } else {
                page.url.searchParams.set('view', a);
            }
            await goto(`${page.url.pathname}${params}`, {
                replaceState: true,
                keepFocus: true,
                invalidateAll: true
            });
        }
    });
</script>

<InviteMemberDialog workspaceId={data.workspace.id} open={showInviteMember} {invitationListRef} />

<Main>
    <div
        class="max-w-desktop relative mx-auto grid h-full grid-rows-[auto_auto_minmax(24rem,1fr)] gap-4"
    >
        <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div>
                <h1 class="capitalize">Workspace members</h1>
                <p class="c-text-secondary">Invite people and manage teammates easily.</p>
            </div>
            {#if can.invite}
                <Button
                    type="button"
                    variant="primary"
                    class="flex w-fit items-center gap-2 capitalize max-sm:w-full max-sm:justify-center"
                    onclick={() => {
                        $showInviteMember = true;
                    }}
                >
                    <IconUserPlus />
                    Invite member
                </Button>
            {/if}
        </div>
        <Tabs {...tabsBuilder.triggerList} class="max-sm:-mt-2 sm:w-fit">
            <a
                {...tabsBuilder.getTrigger('active')}
                data-sveltekit-replacestate
                href="{page.url.pathname}{fluentSearchParams(page.url).delete('view')}"
                class="c-tab--trigger flex items-center gap-2 capitalize max-sm:flex-1 max-sm:justify-center"
            >
                <IconUsers />
                Active members
            </a>
            <a
                {...tabsBuilder.getTrigger('pending')}
                data-sveltekit-replacestate
                href="{page.url.pathname}{fluentSearchParams(page.url).set('view', 'pending')}"
                class="c-tab--trigger flex items-center gap-2 capitalize max-sm:flex-1 max-sm:justify-center"
            >
                <IconEnvelopeOutline />
                Pending invitations
            </a>
        </Tabs>
        <div class="overflow-hidden">
            <div {...tabsBuilder.getContent('active')} class="h-full">
                <ActiveMembers {data} canDelete={can.deleteMember} />
            </div>
            <div {...tabsBuilder.getContent('pending')} class="h-full">
                <PendingMembers {invitationListRef} canDelete={can.deleteInvitation} />
            </div>
        </div>
    </div>
</Main>
