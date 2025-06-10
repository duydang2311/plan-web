<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { writable } from 'svelte/store';
    import { Button, Popover, PopoverBuilder } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import PopoverArrow from '~/lib/components/PopoverArrow.svelte';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalProjectMember } from './utils';

    const {
        ref,
        id,
        name
    }: { ref: Ref<PaginatedList<LocalProjectMember> | undefined>; id: number; name: string } = $props();
    const open = writable(false);
</script>

<PopoverBuilder options={{ open, forceVisible: true }}>
    {#snippet children({ trigger, arrow, content, close })}
        <Button
            type="button"
            variant="negative"
            size="sm"
            filled={false}
            class="flex items-center gap-2"
            melt={trigger}
        >
            <IconTrash />
            Delete
        </Button>
        {#if $open}
            <Popover melt={content}>
                <PopoverArrow melt={arrow} />
                <h2>Delete member?</h2>
                <p>
                    The user <span class="font-bold">{name}</span> will be removed from the project.
                </p>
                <form
                    method="post"
                    action="?/delete-member"
                    class="mt-4 flex justify-end gap-2 *:w-fit"
                    use:enhance={() => {
                        const old = ref.value;
                        if (old) {
                            ref.value = {
                                items: old.items.filter((a) => a.id !== id),
                                totalCount: old.totalCount - 1
                            };
                        }
                        return async ({ result }) => {
                            if (result.type === 'failure') {
                                ref.value = old;
                            }
                            await invalidateAll();
                        };
                    }}
                >
                    <input type="hidden" name="id" value={id} />
                    <Button type="button" variant="base" outline melt={close}>Cancel</Button>
                    <Button
                        type="submit"
                        variant="negative"
                        outline
                        class="flex items-center gap-2"
                    >
                        <IconTrash />
                        Remove
                    </Button>
                </form>
            </Popover>
        {/if}
    {/snippet}
</PopoverBuilder>
