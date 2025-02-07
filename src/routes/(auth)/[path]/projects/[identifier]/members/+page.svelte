<script lang="ts">
    import { Button, Icon, Input, Main } from '~/lib/components';
    import ProjectMemberList from './ProjectMemberList.svelte';
    import type { PageData } from './$types';
    import InvitationDialog from './InvitationDialog.svelte';
    import { writable } from 'svelte/store';
    import SelectView from './SelectView.svelte';
    import { fluentSearchParams } from '~/lib/utils/url';
    import { page } from '$app/state';
    import type { SelectOption } from '@melt-ui/svelte';
    import { untrack } from 'svelte';
    import type { IconName } from '~/lib/components/Icon.svelte';
    import InvitationList from './InvitationList.svelte';

    const { data }: { data: PageData } = $props();
    const invitationDialogOpen = writable(false);
    const views: (SelectOption<'pending' | 'members'> & { href: string; icon: IconName })[] =
        $derived([
            {
                label: 'Members',
                value: 'members',
                href: `${page.url.pathname}${fluentSearchParams(page.url).delete('view').toString()}`,
                icon: 'users'
            },
            {
                label: 'Pending invitations',
                value: 'pending',
                href: `${page.url.pathname}${fluentSearchParams(page.url).set('view', 'pending').toString()}`,
                icon: 'user-plus'
            }
        ]);
    const selectedView = writable<SelectOption<string>>(
        untrack(() => views.find((a) => a.value === page.url.searchParams.get('view')) ?? views[0])
    );
</script>

<InvitationDialog projectId={data.project.id} open={invitationDialogOpen} />

<Main class="p-0 grid grid-rows-[auto_1fr] overflow-hidden">
    <div class="border-b border-b-base-border-2 flex divide-x divide-base-border-3">
        <div>
            <SelectView selected={selectedView} {views} />
        </div>
        <div class="relative grow">
            <Input
                placeholder="Search member..."
                class="border-0 focus:ring-0 text-sm py-0 h-full pl-8"
            />
            <Icon
                name="search"
                class="absolute left-0 translate-x-1/2 top-1/2 -translate-y-1/2 text-base-fg-5"
            />
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
        {#if $selectedView.value === 'pending'}
            <InvitationList projectId={data.project.id} />
        {:else}
            <ProjectMemberList projectId={data.project.id} />
        {/if}
    </div>
</Main>
