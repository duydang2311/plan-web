<script lang="ts">
    import { writable } from 'svelte/store';
    import { Button, Main } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { PageData } from './$types';
    import InvitationDialog from './InvitationDialog.svelte';
    import ViewTab from './ViewTab.svelte';

    const { data }: { data: PageData } = $props();
    const invitationDialogOpen = writable(false);
    const memberListRef = createRef.maybePromise(() => data.memberList);
    const invitationListRef = createRef.maybePromise(() => data.memberInvitationList);
</script>

<InvitationDialog projectId={data.project.id} open={invitationDialogOpen} ref={invitationListRef} />

<Main class="@container overflow-auto">
    <div class="max-w-desktop mx-auto grid h-full grid-rows-[auto_auto_minmax(24rem,1fr)] gap-4">
        <div class="@xl:flex-row flex flex-col items-baseline justify-between gap-x-8 gap-y-4">
            <div>
                <h2>Members</h2>
                <p class="c-text-secondary text-pretty">
                    Manage your project members and their roles. You can invite new members or
                    manage existing ones.
                </p>
            </div>
            <Button
                type="button"
                variant="primary"
                class="@xl:w-fit @xl:justify-start flex w-full items-center justify-center gap-2 text-nowrap"
                onclick={() => {
                    $invitationDialogOpen = true;
                }}
            >
                <IconPlus />
                Invite user
            </Button>
        </div>
        <ViewTab value={data.view} {memberListRef} {invitationListRef} />
    </div>
</Main>
