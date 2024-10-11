<script lang="ts">
    import { enhance } from '$app/forms';
    import { melt } from '@melt-ui/svelte';
    import { useQueryClient } from '@tanstack/svelte-query';
    import clsx from 'clsx';
    import { writable } from 'svelte/store';
    import {
        Badge,
        Button,
        Icon,
        Popover,
        PopoverArrow,
        PopoverBuilder,
        Row,
        Spinner
    } from '~/lib/components';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamInvitation } from '~/lib/models/team';
    import type { SubmitFunction } from './$types';
    import { decodeRevoke, validateRevoke } from './utils';

    interface Props {
        data: TeamInvitation;
    }

    const { data }: Props = $props();
    const queryClient = useQueryClient();
    const open = writable(false);
    let status = $state.raw<'submitting' | null>(null);
    const isSubmitting = $derived(status === 'submitting');

    const submit: SubmitFunction = () => {
        status = 'submitting';
        $open = false;
        return async ({ formData, result, update }) => {
            if (result.type === 'success') {
                const validation = validateRevoke(decodeRevoke(formData));
                if (validation.ok) {
                    queryClient.setQueryData<PaginatedList<TeamInvitation>>(
                        ['team-invitations', { teamId: data.teamId }],
                        (a) =>
                            a
                                ? paginatedList({
                                      items: a.items.filter(
                                          (x) =>
                                              x.teamId !== validation.data.teamId ||
                                              x.member.id !== validation.data.memberId
                                      )
                                  })
                                : a
                    );
                }
            }
            await update({ reset: false, invalidateAll: false });
            status = null;
        };
    };
</script>

<Row class={clsx(status === 'submitting' && 'animate-twPulse')}>
    <td>
        {data.member.email}
    </td>
    <td>
        <Badge variant="info" size="sm">Invitation pending</Badge>
    </td>
    <td>
        <div class="flex gap-2">
            <PopoverBuilder options={{ open, forceVisible: true }}>
                {#snippet children({ trigger, content, arrow, close })}
                    <Button
                        type="button"
                        variant="negative"
                        size="sm"
                        class="flex gap-2 items-center w-fit"
                        melt={trigger}
                        disabled={isSubmitting}
                    >
                        {#if isSubmitting}
                            <Spinner class="size-5" />
                        {:else}
                            <Icon name="trash" class="size-5" />
                        {/if}
                        Revoke
                    </Button>
                    {#if $open}
                        <div use:melt={content} class="p-4">
                            <Popover class="relative text-balance">
                                <PopoverArrow melt={arrow}></PopoverArrow>
                                <h1 class="text-h4 mb-4">Revoke team invitation?</h1>
                                <p>
                                    The user <strong>{data.member.email}</strong> will no longer be able
                                    to join the team for now.
                                </p>
                                <form
                                    method="post"
                                    action="?/revoke-invitation"
                                    class="flex justify-end gap-4 mt-4"
                                    use:enhance={submit}
                                >
                                    <input type="hidden" name="teamId" value={data.teamId} />
                                    <input type="hidden" name="memberId" value={data.member.id} />
                                    <Button type="button" variant="base" class="w-fit" melt={close}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="negative"
                                        class="w-fit"
                                        disabled={isSubmitting}
                                    >
                                        Revoke
                                    </Button>
                                </form>
                            </Popover>
                        </div>
                    {/if}
                {/snippet}
            </PopoverBuilder>
        </div>
    </td>
</Row>
