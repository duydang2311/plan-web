<script lang="ts" context="module">
    declare global {
        namespace App {
            interface PageState {
                showInvitationDialog?: boolean;
            }
        }
    }
</script>

<script lang="ts">
    import { invalidate, replaceState } from '$app/navigation';
    import { createQuery } from '@tanstack/svelte-query';
    import { Button, Icon, Row, Table, Th, THead } from '~/lib/components';
    import { GenericError } from '~/lib/models/errors';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamMember } from '~/lib/models/team';
    import type { ActionData, PageData } from './$types';
    import MemberRow from './MemberRow.svelte';
    import { page } from '$app/stores';
    import InvitationDialog from './InvitationDialog.svelte';
    import { none } from '~/lib/utils/transition';

    let { data, form }: { data: PageData; form: ActionData } = $props();
    const query = createQuery<PaginatedList<TeamMember>, GenericError>({
        queryKey: ['team-members', { teamId: data.team.id }],
        queryFn: async () => {
            await invalidate('fetch:team-members');
            return data.teamMemberList;
        }
    });

    function handleInvite() {
        replaceState('', { ...$page.state, showInvitationDialog: true });
    }
</script>

{#if $page.state.showInvitationDialog}
    <div out:none={{ duration: 200 }}>
        <InvitationDialog
            team={data.team}
            {form}
            defaultOpen={true}
            onClose={() => {
                replaceState('', { ...$page.state, showInvitationDialog: false });
            }}
        />
    </div>
{/if}
<main class="h-full flex flex-col divide divide-y divide-base-border">
    <div class="px-8 py-2 flex justify-between items-center">
        <div>
            <h1 class="sr-only">Manage team members</h1>
            <h2>Members</h2>
        </div>
        <div>
            <Button
                variant="base"
                outline
                size="sm"
                class="flex gap-4 items-center"
                onclick={handleInvite}
            >
                <Icon name="user-plus" />
                <span>Invite member</span>
            </Button>
        </div>
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
