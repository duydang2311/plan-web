<script lang="ts">
    import type { SubmitFunction } from '@sveltejs/kit';
    import { Button, IconButton } from '~/lib/components';
    import { IconEditOutline, IconMenu } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import ChecklistItemActionDelete from './ChecklistItemActionDelete.svelte';

    const {
        itemId,
        onEdit,
        onDeleteSubmit
    }: {
        itemId: string;
        onEdit: VoidFunction;
        onDeleteSubmit: SubmitFunction;
    } = $props();
    const popover = new Popover.Builder({
        forceVisible: true
    });
</script>

<IconButton
    {...popover.trigger}
    data-custom-state={popover.open ? 'open' : undefined}
    type="button"
    variant="base"
    class="ml-auto"
>
    <IconMenu />
</IconButton>
{#if popover.open}
    <Popover {...popover.content}>
        <ul class="space-y-1">
            <li>
                <Button
                    type="button"
                    variant="base"
                    size="sm"
                    filled={false}
                    class="flex items-center gap-4 px-2"
                    onclick={onEdit}
                >
                    <IconEditOutline />
                    <span>Edit</span>
                </Button>
            </li>
            <li>
                <ChecklistItemActionDelete {itemId} onSubmit={onDeleteSubmit} />
            </li>
        </ul>
    </Popover>
{/if}
