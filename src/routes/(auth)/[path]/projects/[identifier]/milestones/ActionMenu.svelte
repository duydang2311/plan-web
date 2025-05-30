<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, IconButton } from '~/lib/components';
    import { IconMenu, IconTrash, IconViewOutline } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import type { OnDeleteSubmit } from './types';

    const {
        id,
        canDelete,
        onDeleteSubmit
    }: { id: string; canDelete: boolean; onDeleteSubmit: OnDeleteSubmit } = $props();
    const popover = new Popover.Builder({
        forceVisible: true
    });
</script>

<div>
    <IconButton {...popover.trigger} type="button" variant="base">
        <IconMenu />
    </IconButton>
    {#if popover.open}
        <Popover {...popover.content}>
            <ul>
                <li>
                    <Button
                        type="button"
                        variant="base"
                        filled={false}
                        size="sm"
                        class="flex items-center gap-4 px-2"
                    >
                        <IconViewOutline />
                        View
                    </Button>
                </li>
                {#if canDelete}
                    <li>
                        <form
                            method="post"
                            action="?/delete_milestone"
                            use:enhance={(e) => {
                                return onDeleteSubmit(id, e);
                            }}
                        >
                            <input type="hidden" name="id" value={id} />
                            <Button
                                type="submit"
                                variant="negative"
                                filled={false}
                                size="sm"
                                class="flex items-center gap-4 px-2"
                            >
                                <IconTrash />
                                Delete
                            </Button>
                        </form>
                    </li>
                {/if}
            </ul>
        </Popover>
    {/if}
</div>
