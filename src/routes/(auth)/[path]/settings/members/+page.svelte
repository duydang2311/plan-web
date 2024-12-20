<script lang="ts">
    import { page } from '$app/stores';
    import { writable } from 'svelte/store';
    import { Button, Icon, Input } from '~/lib/components';
    import type { ActionData, PageData } from './$types';
    import ActiveMembers from './ActiveMembers.svelte';
    import InviteMemberDialog from './InviteMemberDialog.svelte';
    import SelectView from './SelectView.svelte';
    import PendingMembers from './PendingMembers.svelte';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    const showInviteMember = writable(false);
    const view = $page.url.searchParams.get('view');
    const viewOptions = [
        {
            label: 'Active members',
            value: 'active' as const,
            icon: 'users-solid' as const,
            default: true
        },
        { label: 'Pending members', value: 'pending' as const, icon: 'user-plus' as const }
    ];
    const selectedView = writable(
        view
            ? viewOptions.find((a) => a.value === view)
            : viewOptions.find((a) => a.default === true)
    );
</script>

<InviteMemberDialog
    workspaceId={data.workspace.id}
    open={showInviteMember}
    form={form?.inviteMember}
/>

<main class="grid grid-rows-[auto_1fr] h-full overflow-auto divide-y divide-base-border-2">
    <div class="flex divide-x divide-base-border-2">
        <SelectView options={viewOptions} selected={selectedView} />
        <div class="relative grow">
            <Icon
                name="search"
                class="absolute left-2 top-1/2 -translate-y-1/2 text-base-fg-ghost"
            />
            <Input
                type="text"
                class="pl-8 border-none focus:shadow-none py-0 h-full"
                placeholder="Search member"
            />
        </div>
        <div>
            <Button
                variant="base"
                size="sm"
                filled={false}
                class="rounded-none w-fit h-full flex items-center gap-2 pr-8 py-2"
                flat
                onclick={() => {
                    $showInviteMember = true;
                }}
            >
                <Icon name="plus" />
                Invite member
            </Button>
        </div>
    </div>
    {#if $selectedView.value === 'pending'}
        <PendingMembers {data} />
    {:else}
        <ActiveMembers {data} />
    {/if}
</main>
