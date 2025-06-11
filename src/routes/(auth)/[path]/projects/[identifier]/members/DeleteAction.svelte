<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { Button } from '~/lib/components';
    import { IconTrash, IconXMark } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalProjectMember } from './utils';

    const {
        ref,
        id,
        name
    }: { ref: Ref<PaginatedList<LocalProjectMember> | undefined>; id: number; name: string } =
        $props();
    const popover = new Popover.Builder({
        forceVisible: true,
        floatingConfig: {
            shift: {
                padding: { right: 16 }
            }
        }
    });
</script>

<div>
    <Button
        {...popover.trigger}
        type="button"
        variant="negative"
        size="sm"
        filled={false}
        class="flex items-center gap-2"
    >
        <IconTrash />
        Delete
    </Button>
    {#if popover.open}
        <Popover {...popover.content} class="max-w-paragraph-sm p-4">
            <h2>Delete member?</h2>
            <p>
                The user <strong>{name}</strong> will be removed from the project. This action cannot
                be undone.
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
                <Button
                    type="button"
                    variant="base"
                    outline
                    class="flex items-center gap-2"
                    onclick={() => {
                        popover.open = false;
                    }}
                >
                    <IconXMark />
                    Cancel
                </Button>
                <Button type="submit" variant="negative" class="flex items-center gap-2">
                <IconTrash />
                    Remove
                </Button>
            </form>
        </Popover>
    {/if}
</div>
