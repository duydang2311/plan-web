<script lang="ts">
    import { DateTime } from 'luxon';
    import { IconCalendar, IconCalendarRange } from '~/lib/components/icons';
    import { formatDateUi } from '~/lib/utils/time';

    const { startTime, endTime }: { startTime?: string; endTime?: string } = $props();
</script>

{#if startTime && endTime}
    <div class="col-span-full grid grid-cols-subgrid items-center gap-2 capitalize">
        <IconCalendarRange />
        <span>{formatDateUi(startTime)} - {formatDateUi(endTime)}</span>
    </div>
{:else if startTime}
    {@const dt = DateTime.fromISO(startTime)}
    <div class="col-span-full grid grid-cols-subgrid items-center gap-2">
        <IconCalendar />
        <span>{dt < DateTime.now() ? 'Started' : 'Starting'} {formatDateUi(startTime)}</span>
    </div>
{:else if endTime}
    <div class="col-span-full grid grid-cols-subgrid items-center gap-2">
        <IconCalendar />
        <span>Due {formatDateUi(endTime)}</span>
    </div>
{/if}
