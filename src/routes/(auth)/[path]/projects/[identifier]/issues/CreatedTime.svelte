<script lang="ts">
    import { RelativeTime } from '~/lib/components';
    import { IconClockOutline } from '~/lib/components/icons';

    const { createdTime }: { createdTime: string } = $props();
</script>

<div class="col-span-full grid grid-cols-subgrid items-center gap-2">
    <IconClockOutline />
    <span>Created <RelativeTime time={createdTime} /></span>
</div>
