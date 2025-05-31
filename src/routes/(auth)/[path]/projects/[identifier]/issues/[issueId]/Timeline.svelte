<script lang="ts">
    import { CalendarDate } from '@internationalized/date';
    import { DateTime } from 'luxon';
    import { watch } from '~/lib/utils/runes.svelte';
    import DateTimePicker from './DateTimePicker.svelte';

    const {
        issueId,
        startTime: defaultStartTime,
        endTime: defaultEndTime,
        zone
    }: {
        issueId: string;
        startTime?: string;
        endTime?: string;
        zone?: string;
    } = $props();

    let startTime = $state.raw<DateTime | undefined>(
        defaultStartTime ? DateTime.fromISO(defaultStartTime, { zone }).toLocal() : undefined
    );
    let endTime = $state.raw<DateTime | undefined>(
        defaultEndTime ? DateTime.fromISO(defaultEndTime, { zone }).toLocal() : undefined
    );
    let startPicker = $state.raw<DateTimePicker>();
    let endPicker = $state.raw<DateTimePicker>();

    watch(() => [defaultStartTime, zone])(() => {
        startTime = defaultStartTime
            ? DateTime.fromISO(defaultStartTime, { zone }).toLocal()
            : undefined;
    });

    watch(() => [defaultEndTime, zone])(() => {
        endTime = defaultEndTime ? DateTime.fromISO(defaultEndTime, { zone }).toLocal() : undefined;
    });

    watch(() => [startTime])(() => {
        if (startTime == null || endTime == null) {
            return;
        }
        if (endTime < startTime) {
            endTime = startTime.set({ hour: Math.max(startTime.hour, 17) });
            endPicker?.invalidate();
        }
    });

    watch(() => [endTime])(() => {
        if (endTime == null) {
            return;
        }
        if (startTime == null || endTime < startTime) {
            startTime = endTime.set({ hour: Math.min(endTime.hour, 8) });
            startPicker?.invalidate();
        }
    });
</script>

<DateTimePicker
    bind:this={startPicker}
    name="startTime"
    label="Start time"
    {issueId}
    bind:value={startTime}
    defaultTime={'08:00 AM'}
    highlightDate={endTime}
    isDateDisabled={(date) => {
        if (endTime == null) {
            return false;
        }
        return date.compare(new CalendarDate(endTime.year, endTime.month, endTime.day)) > 0;
    }}
/>
<div>
<DateTimePicker
    bind:this={endPicker}
    name="endTime"
    label="End time"
    {issueId}
    bind:value={endTime}
    defaultTime={'05:00 PM'}
    highlightDate={startTime}
    isDateDisabled={(date) => {
        if (startTime == null) {
            return true;
        }
        return date.compare(new CalendarDate(startTime.year, startTime.month, startTime.day)) < 0;
    }}
/>
{#if startTime && endTime}
    {@const duration = endTime.diff(startTime, ['months', 'days', 'hours', 'minutes', 'seconds'])}
    {#if Math.abs(duration.shiftTo('seconds').seconds) > Number.EPSILON}
        {@const format = Object.entries(duration.toObject())
            .filter(([_, v]) => v > 0)
            .map(([k, v]) => `${Math.floor(v)} ${k}`)
            .join(', ')}
        <p class="c-text-secondary text-base-fg-5 mt-0.5">
            Task duration: {format}.
        </p>
    {/if}
{/if}
</div>