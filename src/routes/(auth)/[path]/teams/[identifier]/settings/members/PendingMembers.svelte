<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { createQuery } from '@tanstack/svelte-query';
    import { Row, Table, Th, THead } from '~/lib/components';
    import type { GenericError } from '~/lib/models/errors';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamInvitation } from '~/lib/models/team';
    import type { PageData } from './$types';
    import PendingMemberRow from './PendingMemberRow.svelte';
    import { browser } from '$app/environment';
    import gsap from 'gsap';
    import Flip from 'gsap/dist/Flip';
    import { tick } from 'svelte';
    import { createEffect } from '~/lib/utils/svelte';

    interface Props {
        data: PageData;
    }

    if (browser) {
        gsap.registerPlugin(Flip);
    }

    const { data }: Props = $props();

    const query = createQuery<PaginatedList<TeamInvitation>, GenericError>({
        queryKey: ['team-invitations', { teamId: data.team.id }],
        queryFn: async () => {
            await invalidate('fetch:team-invitations');
            return data.teamInvitationList!;
        }
    });
    let tbody = $state<HTMLElement>();

    createEffect.pre(
        () => {
            if (!tbody) {
                return;
            }
            const state = Flip.getState(tbody.querySelectorAll('& > tr'), {
                props: 'height'
            });
            tick().then(() => {
                Flip.from(state, {
                    targets: tbody!.querySelectorAll('& > tr'),
                    duration: 0.3,
                    ease: 'power1.inOut'
                });
            });
        },
        () => $query
    );
</script>

<Table class="w-full rounded-md" style="grid-template-columns: 1fr 1fr auto;">
    <THead class="relative">
        <Row class="py-2">
            <Th>Member</Th>
            <Th>Status</Th>
            <Th></Th>
        </Row>
    </THead>
    <tbody bind:this={tbody} class="animate-tbody">
        {#if $query.data}
            {#each $query.data.items as item (item.member.id)}
                <PendingMemberRow data={item} />
            {/each}
        {/if}
    </tbody>
</Table>
