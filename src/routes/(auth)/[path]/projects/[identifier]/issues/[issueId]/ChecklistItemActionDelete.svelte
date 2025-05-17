<script lang="ts">
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';
    import { Button } from '~/lib/components';
    import { IconTrash, IconXMark } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';

    const { itemId, onSubmit }: { itemId: string; onSubmit: SubmitFunction } = $props();
    const popover = new Popover.Builder({
        forceVisible: true
    });
</script>

<Button
    {...popover.trigger}
    type="button"
    variant="negative"
    size="sm"
    filled={false}
    class="flex items-center gap-4 px-2"
>
    <IconTrash />
    <span>Delete</span>
</Button>
{#if popover.open}
    <Popover {...popover.content} class="max-w-paragraph-sm p-4 text-sm">
        <h2>Delete checklist item?</h2>
        <p class="text-pretty">
            You're about to delete the checklist item. This action cannot be undone.
        </p>
        <form
            method="post"
            action="?/delete_checklist_item"
            class="mt-2 flex justify-end gap-2 *:w-fit"
            use:enhance={onSubmit}
        >
            <input type="hidden" name="id" value={itemId} />
            <Button
                type="button"
                variant="base"
                class="flex items-center gap-2"
                onclick={() => {
                    popover.open = false;
                }}
            >
                <IconXMark />
                <span>Cancel</span>
            </Button>
            <Button type="submit" variant="negative" class="flex items-center gap-2">
                <IconTrash />
                <span>Delete</span>
            </Button>
        </form>
    </Popover>
{/if}
