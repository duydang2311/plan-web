<script lang="ts">
    import { enhance } from '$app/forms';
    import { useQueryClient } from '@tanstack/svelte-query';
    import { addToast, Button } from '~/lib/components';
    import { IconCheck, IconXMark } from '~/lib/components/icons';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamInvitation } from '~/lib/models/team';
    import { createTeamInvitationListQuery } from './utils';

    const { userId }: { userId: string } = $props();
    const queryClient = useQueryClient();
    const query = createTeamInvitationListQuery(() => ({ userId }));
</script>

{#if $query.data && $query.data.items.length > 0}
    <div class="border-base-border-2 rounded-md border p-4">
        <h2>Team invitations</h2>
        <ul>
            {#each $query.data.items as invitation (invitation.id)}
                <li
                    class="border-base-border-2 flex flex-wrap items-center justify-between gap-4 rounded-md border p-4"
                >
                    <p class="text-h5 text-base-fg-1">
                        {invitation.team.name}
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <form
                            method="post"
                            action="?/accept-team-invitation"
                            use:enhance={() => {
                                return async ({ result, update }) => {
                                    if (result.type === 'success') {
                                        queryClient.setQueryData<PaginatedList<TeamInvitation>>(
                                            ['team-invitations'],
                                            (a) =>
                                                a
                                                    ? paginatedList<TeamInvitation>({
                                                          items: a.items.filter(
                                                              (b) => b.id !== invitation.id
                                                          ),
                                                          totalCount: a.totalCount - 1
                                                      })
                                                    : undefined
                                        );
                                        addToast({
                                            data: {
                                                title: 'Invitation accepted',
                                                description: `You have joined team ${invitation.team.name}.`
                                            }
                                        });
                                    }
                                    await update({ invalidateAll: false, reset: false });
                                };
                            }}
                        >
                            <input type="hidden" name="teamInvitationId" value={invitation.id} />
                            <Button
                                type="submit"
                                variant="positive"
                                filled={false}
                                outline
                                class="flex w-fit items-center gap-2"
                            >
                                <IconCheck />
                                Accept
                            </Button>
                        </form>
                        <form
                            method="post"
                            action="?/decline-team-invitation"
                            use:enhance={() => {
                                return async ({ result, update }) => {
                                    if (result.type === 'success') {
                                        queryClient.setQueryData<PaginatedList<TeamInvitation>>(
                                            ['team-invitations'],
                                            (a) =>
                                                a
                                                    ? paginatedList<TeamInvitation>({
                                                          items: a.items.filter(
                                                              (b) => b.id !== invitation.id
                                                          ),
                                                          totalCount: a.totalCount - 1
                                                      })
                                                    : undefined
                                        );
                                        addToast({
                                            data: {
                                                title: 'Invitation declined',
                                                description: `Invitation to team ${invitation.team.name} has been declined.`
                                            }
                                        });
                                    }
                                    await update({ invalidateAll: false, reset: false });
                                };
                            }}
                        >
                            <input type="hidden" name="teamInvitationId" value={invitation.id} />
                            <Button
                                type="submit"
                                variant="negative"
                                filled={false}
                                outline
                                class="flex w-fit items-center gap-2"
                            >
                                <IconXMark />
                                Decline
                            </Button>
                        </form>
                    </div>
                </li>
            {/each}
        </ul>
    </div>
{/if}
