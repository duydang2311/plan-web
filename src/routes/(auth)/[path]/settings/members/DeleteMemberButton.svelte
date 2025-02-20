<script lang="ts">
    import { enhance } from '$app/forms';
    import { useQueryClient } from '@tanstack/svelte-query';
    import { writable } from 'svelte/store';
    import { addToast, Button, IconButton, Popover, PopoverBuilder } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import PopoverArrow from '~/lib/components/PopoverArrow.svelte';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { LocalWorkspaceMember } from './+page.server';
    import { validateDeleteMemberActionFailure } from './utils';

    const { id, queryKey }: { id: number; queryKey: unknown[] } = $props();

    const queryClient = useQueryClient();
    const open = writable(false);
</script>

<div>
    <PopoverBuilder options={{ open, forceVisible: true }}>
        {#snippet children({ trigger, content, arrow, close })}
            <IconButton
                type="submit"
                variant="negative"
                title="Remove member"
                class="w-fit"
                melt={trigger}
            >
                <IconTrash />
            </IconButton>
            {#if $open}
                <Popover melt={content} class="max-w-paragraph-sm">
                    <PopoverArrow melt={arrow} />
                    <h2>Delete member?</h2>
                    <p class="mt-1 text-pretty">
                        The member will be removed both from the current workspace and from all of
                        their current teams.
                    </p>
                    <form
                        method="post"
                        action="?/delete-member"
                        class="mt-4 flex items-center justify-end gap-2"
                        use:enhance={() => {
                            const old =
                                queryClient.getQueryData<PaginatedList<LocalWorkspaceMember>>(
                                    queryKey
                                );
                            if (old) {
                                queryClient.setQueryData(queryKey, {
                                    ...old,
                                    items: old.items.filter((a) => a.id !== id)
                                });
                            }
                            return async ({ result }) => {
                                if (result.type === 'failure') {
                                    queryClient.setQueryData(queryKey, old);

                                    const validation = validateDeleteMemberActionFailure(
                                        result.data?.deleteMember
                                    );
                                    if (!validation.ok) {
                                        addToast({
                                            data: {
                                                title: 'Could not delele member',
                                                description:
                                                    'There was an unknown error while deleting the member.'
                                            }
                                        });
                                    } else {
                                        addToast({
                                            data: {
                                                title: 'Could not delele member',
                                                description: validation.data.errors.root
                                                    .map((a) =>
                                                        a === '403'
                                                            ? "You don't have sufficient permission to delete this member."
                                                            : a
                                                    )
                                                    .join(' ')
                                            }
                                        });
                                    }
                                }
                                await queryClient.invalidateQueries({ queryKey });
                            };
                        }}
                    >
                        <input type="hidden" name="id" value={id} />
                        <Button type="button" variant="base" outline class="w-fit" melt={close}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="negative" outline class="w-fit">
                            Delete
                        </Button>
                    </form>
                </Popover>
            {/if}
        {/snippet}
    </PopoverBuilder>
</div>
