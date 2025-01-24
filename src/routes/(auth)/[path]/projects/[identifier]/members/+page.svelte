<script lang="ts">
    import { Button, Icon, Input, Main } from '~/lib/components';
    import ProjectMemberList from './ProjectMemberList.svelte';
    import type { PageData } from './$types';
    import InvitationDialog from './InvitationDialog.svelte';
    import { writable } from 'svelte/store';

    const { data }: { data: PageData } = $props();
    const invitationDialogOpen = writable(false);
</script>

<InvitationDialog projectId={data.project.id} open={invitationDialogOpen} />

<Main class="p-0 grid grid-rows-[auto_1fr] overflow-hidden">
    <div class="border-b border-b-base-border-2 flex divide-x divide-base-border-3">
        <div class="relative grow">
            <Input
                placeholder="Search member..."
                class="border-0 focus:ring-0 text-sm py-0 h-full pl-14"
            />
            <Icon name="search" class="absolute left-8 top-1/2 -translate-y-1/2 text-base-fg-5" />
        </div>
        <Button
            type="button"
            flat
            variant="base"
            size="sm"
            filled={false}
            class="flex items-center gap-2 w-fit border-r border-r-base-border-2 pr-8"
            onclick={() => {
                $invitationDialogOpen = true;
            }}
        >
            <Icon name="plus" />
            Invite user
        </Button>
    </div>
    <div class="overflow-auto">
        <ProjectMemberList projectId={data.project.id} />
    </div>
</Main>
