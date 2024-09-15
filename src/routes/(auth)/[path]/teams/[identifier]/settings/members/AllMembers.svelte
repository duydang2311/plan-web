<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { createQuery } from '@tanstack/svelte-query';
    import { Table, THead, Row, Th } from '~/lib/components';
    import type { GenericError } from '~/lib/models/errors';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamMember } from '~/lib/models/team';
    import MemberRow from './MemberRow.svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    const { data }: Props = $props();

    const query = createQuery<PaginatedList<TeamMember>, GenericError>({
        queryKey: ['team-members', { teamId: data.team.id }],
        queryFn: async () => {
            await invalidate('fetch:team-members');
            return data.teamMemberList!;
        }
    });
</script>

<Table class="w-full rounded-md" style="grid-template-columns: 1fr 1fr;">
    <THead>
        <Row class="py-2">
            <Th>Member</Th>
            <Th>Role</Th>
        </Row>
    </THead>
    <tbody>
        {#if $query.data}
            {#each $query.data.items as item (item.member.id)}
                <MemberRow data={item} />
            {/each}
        {/if}
    </tbody>
</Table>
