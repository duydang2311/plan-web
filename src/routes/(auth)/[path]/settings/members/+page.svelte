<script lang="ts">
    import { page } from '$app/state';
    import { writable } from 'svelte/store';
    import { Button, Input } from '~/lib/components';
    import { IconPlus, IconSearch, IconUserPlus, IconUsersSolid } from '~/lib/components/icons';
    import type { ActionData, PageData } from './$types';
    import ActiveMembers from './ActiveMembers.svelte';
    import InviteMemberDialog from './InviteMemberDialog.svelte';
    import PendingMembers from './PendingMembers.svelte';
    import SelectView from './SelectView.svelte';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { permissions } from '~/lib/models/permission';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    const showInviteMember = writable(false);
    const view = page.url.searchParams.get('view');
    const viewOptions = [
        {
            label: 'Active members',
            value: 'active' as const,
            icon: IconUsersSolid,
            default: true
        },
        { label: 'Pending members', value: 'pending' as const, icon: IconUserPlus }
    ];
    const selectedView = writable(
        view
            ? viewOptions.find((a) => a.value === view)
            : viewOptions.find((a) => a.default === true)
    );
    const workspacePermissionsRef = createRef.maybePromise(() => data.workspacePermissions);
    const can = {
        invite: workspacePermissionsRef.value?.has(permissions.createWorkspaceInvitation) ?? false
    };
</script>

<InviteMemberDialog
    workspaceId={data.workspace.id}
    open={showInviteMember}
    form={form?.inviteMember}
/>

<main class="divide-base-border-2 grid h-full grid-rows-[auto_1fr] divide-y overflow-auto">
    <div class="divide-base-border-2 flex divide-x">
        <SelectView options={viewOptions} selected={selectedView} />
        <div class="relative grow">
            <IconSearch class="text-base-fg-ghost absolute left-2 top-1/2 -translate-y-1/2" />
            <Input
                type="text"
                class="h-full border-none bg-transparent py-0 pl-8 focus:shadow-none"
                placeholder="Search member"
            />
        </div>
        {#if can.invite}
            <div>
                <Button
                    variant="base"
                    size="sm"
                    filled={false}
                    class="flex h-full w-fit items-center gap-2 rounded-none py-2 pr-8"
                    flat
                    onclick={() => {
                        $showInviteMember = true;
                    }}
                >
                    <IconPlus />
                    Invite member
                </Button>
            </div>
        {/if}
    </div>
    {#if $selectedView.value === 'pending'}
        <PendingMembers {data} />
    {:else}
        <ActiveMembers {data} />
    {/if}
</main>
