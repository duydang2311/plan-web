<script lang="ts">
    import { IconButton, MeltPopoverBuilder } from '~/lib/components';
    import { IconBellOutline } from '~/lib/components/icons';
    import NotificationPopover from './NotificationPopover.svelte';

    const { userId }: { userId: string } = $props();
</script>

<MeltPopoverBuilder forceVisible>
    {#snippet children(popover)}
        <IconButton type="button" variant="base" {...popover.trigger}>
            <IconBellOutline />
        </IconButton>
        {#if popover.open}
            <NotificationPopover {userId} builder={popover.content} />
        {/if}
    {/snippet}
</MeltPopoverBuilder>
