<script lang="ts">
    import { page } from '$app/state';
    import { IconUserPlus, IconUsers } from '~/lib/components/icons';
    import Tabs from '~/lib/components/tabs';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { AsyncRef } from '~/lib/utils/runes.svelte';
    import { fluentSearchParams } from '~/lib/utils/url';
    import InvitationList from './InvitationList.svelte';
    import ProjectMemberList from './ProjectMemberList.svelte';
    import type { LocalProjectMember, LocalProjectMemberInvitation } from './utils';

    type View = 'members' | 'pending';

    const {
        value,
        memberListRef,
        invitationListRef
    }: {
        value: View;
        memberListRef: AsyncRef<PaginatedList<LocalProjectMember> | undefined>;
        invitationListRef: AsyncRef<PaginatedList<LocalProjectMemberInvitation> | undefined>;
    } = $props();

    const views = [
        {
            id: 'members',
            label: 'Members',
            href: `${page.url.pathname}${fluentSearchParams(page.url).delete('view').toString()}`,
            icon: IconUsers
        },
        {
            id: 'pending',
            label: 'Pending invitations',
            href: `${page.url.pathname}${fluentSearchParams(page.url).set('view', 'pending').toString()}`,
            icon: IconUserPlus
        }
    ] as const;

    const tabs = new Tabs.Builder({
        value: () => value
    });
</script>

<Tabs class="@xl:w-fit">
    {#each views as v (v.id)}
        <a
            {...tabs.getTrigger(v.id)}
            href={v.href}
            class="c-tab--trigger @xl:w-fit @xl:justify-start flex w-full items-center justify-center gap-2"
            data-sveltekit-replacestate
        >
            <v.icon />
            {v.label}
        </a>
    {/each}
</Tabs>
<div {...tabs.getContent(value)}>
    {#if value === 'members'}
        <div class="h-full">
            <ProjectMemberList ref={memberListRef} />
        </div>
    {:else if value === 'pending'}
        <div class="h-full">
            <InvitationList ref={invitationListRef} />
        </div>
    {/if}
</div>
