<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { createQuery } from '@tanstack/svelte-query';
    import { Row, Table, Th, THead } from '~/lib/components';
    import type { GenericError } from '~/lib/models/errors';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamInvitation } from '~/lib/models/team';
    import type { PageData } from './$types';
    import PendingMemberRow from './PendingMemberRow.svelte';

    interface Props {
        data: PageData;
    }

    const { data }: Props = $props();

    const query = createQuery<PaginatedList<TeamInvitation>, GenericError>({
        queryKey: ['team-invitations', { teamId: data.team.id }],
        queryFn: async () => {
            await invalidate('fetch:team-invitations');
            return data.teamInvitationList!;
        }
    });
</script>

<Table class="w-full rounded-md">
    <colgroup>
        <col />
    </colgroup>
    <THead>
        <Row>
            <Th>Member</Th>
        </Row>
    </THead>
    <tbody>
        {#if $query.data}
            {#each $query.data.items as item (item.member.id)}
                <PendingMemberRow data={item} />
            {/each}
        {/if}
    </tbody>
</Table>
