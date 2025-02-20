<script lang="ts">
    import { page } from '$app/state';
    import type { SelectOption } from '@melt-ui/svelte';
    import { untrack } from 'svelte';
    import { writable } from 'svelte/store';
    import { Button, Input, Main } from '~/lib/components';
    import { IconPlus, IconSearch, IconUserPlus, IconUsers } from '~/lib/components/icons';
    import { fluentSearchParams } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import InvitationDialog from './InvitationDialog.svelte';
    import InvitationList from './InvitationList.svelte';
    import ProjectMemberList from './ProjectMemberList.svelte';
    import SelectView from './SelectView.svelte';

    const { data }: { data: PageData } = $props();
    const invitationDialogOpen = writable(false);
    const views: (SelectOption<'pending' | 'members'> & {
        href: string;
        icon: SvelteIconComponent;
    })[] = $derived([
        {
            label: 'Members',
            value: 'members',
            href: `${page.url.pathname}${fluentSearchParams(page.url).delete('view').toString()}`,
            icon: IconUsers
        },
        {
            label: 'Pending invitations',
            value: 'pending',
            href: `${page.url.pathname}${fluentSearchParams(page.url).set('view', 'pending').toString()}`,
            icon: IconUserPlus
        }
    ]);
    const selectedView = writable<SelectOption<string>>(
        untrack(() => views.find((a) => a.value === page.url.searchParams.get('view')) ?? views[0])
    );
</script>

<InvitationDialog projectId={data.project.id} open={invitationDialogOpen} />

<Main class="grid grid-rows-[auto_1fr] overflow-hidden p-0">
    <div class="border-b-base-border-2 divide-base-border-3 flex divide-x border-b">
        <div>
            <SelectView selected={selectedView} {views} />
        </div>
        <div class="relative grow">
            <Input
                placeholder="Search member..."
                class="h-full border-0 py-0 pl-8 text-sm focus:ring-0"
            />
            <IconSearch
                class="text-base-fg-5 absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2"
            />
        </div>
        <Button
            type="button"
            flat
            variant="base"
            size="sm"
            filled={false}
            class="border-r-base-border-2 flex w-fit items-center gap-2 border-r pr-8"
            onclick={() => {
                $invitationDialogOpen = true;
            }}
        >
            <IconPlus />
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
