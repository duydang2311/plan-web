<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { createQuery } from '@tanstack/svelte-query';
    import { Row, Table, Th, THead } from '~/lib/components';
    import { GenericError } from '~/lib/models/errors';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamMember } from '~/lib/models/team';
    import type { PageData } from './$types';
    import MemberRow from './MemberRow.svelte';

    let { data }: { data: PageData } = $props();
    const query = createQuery<PaginatedList<TeamMember>, GenericError>({
        queryKey: ['team-members', { teamId: data.team.id }],
        queryFn: async () => {
            await invalidate('fetch:team-members');
            return data.teamMemberList;
        }
    });
</script>

<main class="h-full flex flex-col divide divide-y divide-base-border">
    <div class="px-8 py-2">
        <h1 class="sr-only">Manage team members</h1>
        <h2>Members</h2>
    </div>
    <div class="mx-auto grow overflow-auto">
        <Table class="w-full rounded-md">
            <colgroup>
                <col />
                <col />
            </colgroup>
            <THead>
                <Row>
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
    </div>
</main>
