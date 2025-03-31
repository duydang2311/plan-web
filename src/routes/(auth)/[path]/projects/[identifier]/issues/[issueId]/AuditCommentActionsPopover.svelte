<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { writable } from 'svelte/store';
    import { Button, Popover, PopoverArrow, PopoverBuilder, toast } from '~/lib/components';
    import { IconEdit, IconTrash } from '~/lib/components/icons';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalIssueAudit } from './+page.server';

    let {
        auditId,
        ref,
        editing,
        onEdit
    }: {
        auditId: number;
        ref: Ref<PaginatedList<LocalIssueAudit> | undefined>;
        editing: boolean;
        onEdit: () => void;
    } = $props();

    const open = writable(false);
</script>

<div class="space-y-1 text-sm">
    <Button
        type="button"
        filled={false}
        variant="base"
        size="sm"
        class="flex items-center gap-2"
        onclick={onEdit}
        disabled={editing === true}
    >
        <IconEdit />
        Edit
    </Button>
    <PopoverBuilder options={{ open, forceVisible: true }}>
        {#snippet children({ trigger, content, arrow, close })}
            <Button
                type="button"
                filled={false}
                variant="negative"
                size="sm"
                class="flex items-center gap-2"
                melt={trigger}
            >
                <IconTrash />
                Delete
            </Button>
            {#if $open}
                <Popover melt={content} class="w-96 text-pretty">
                    <PopoverArrow melt={arrow} />
                    <div>
                        <h2 class="mb-2">Delete comment?</h2>
                        <p>The comment will be permanently deleted and cannot be undone.</p>
                        <div class="ml-auto mt-4 flex w-fit gap-2">
                            <Button type="button" variant="base" outline melt={close}>
                                Cancel
                            </Button>
                            <form
                                method="post"
                                action="?/delete_comment"
                                use:enhance={async () => {
                                    $open = false;
                                    const old = ref.value;
                                    if (old) {
                                        ref.value = paginatedList({
                                            items: old.items.filter((b) => b.id !== auditId),
                                            totalCount: old.totalCount - 1
                                        });
                                    }
                                    return async ({ result }) => {
                                        if (result.type !== 'success') {
                                            ref.value = old;
                                        } else {
                                            toast({
                                                type: 'positive',
                                                body: 'Comment successfully deleted.'
                                            });
                                        }
                                        await invalidateAll();
                                    };
                                }}
                            >
                                <input type="hidden" name="id" value={auditId} />
                                <Button type="submit" outline variant="negative">Delete</Button>
                            </form>
                        </div>
                    </div>
                </Popover>
            {/if}
        {/snippet}
    </PopoverBuilder>
</div>
