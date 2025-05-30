<script lang="ts">
    import { CalendarDate, type DateValue } from '@internationalized/date';
    import { createDatePicker, melt } from '@melt-ui/svelte';
    import { DateTime } from 'luxon';
    import { toStore } from 'svelte/store';
    import { Button } from '~/lib/components';
    import IconButton from '~/lib/components/IconButton.svelte';
    import { IconCalendar, IconChevronLeft, IconChevronRight } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import { noop } from '~/lib/utils';
    import { formatDateUi } from '~/lib/utils/time';

    const {
        id,
        endTime,
        zone,
        onChange
    }: {
        id: string;
        endTime: string;
        zone: string | undefined;
        onChange: (id: string, date: DateValue | undefined) => void;
    } = $props();
    const popover = new Popover.Builder({
        forceVisible: true
    });
    const {
        elements: { calendar, grid, prevButton, heading, nextButton, cell },
        states: { headingValue, months, weekdays },
        helpers: { isDateDisabled, isDateUnavailable }
    } = createDatePicker({
        value: toStore(() => {
            const time = DateTime.fromISO(endTime, { zone });
            return new CalendarDate(time.year, time.month, time.day);
        }, noop),
        onValueChange: ({ curr, next }) => {
            onChange(id, next);
            return curr;
        }
    });
</script>

<Button
    {...popover.trigger}
    data-custom-state={popover.open ? 'open' : undefined}
    type="button"
    variant="base"
    class="flex w-fit items-center gap-[0.25ch]"
    size="sm"
>
    <IconCalendar />
    <span class="ml-1">{formatDateUi(endTime)}</span>
</Button>
{#if popover.open}
    <Popover {...popover.content} class="p-2">
        <div {...$calendar} use:$calendar.action class="w-full">
            <header class="mb-4 flex items-center justify-between">
                <IconButton {...$prevButton} action={$prevButton.action}>
                    <IconChevronLeft />
                </IconButton>
                <div {...$heading} use:$heading.action>
                    {$headingValue}
                </div>
                <IconButton {...$nextButton} action={$nextButton.action}>
                    <IconChevronRight />
                </IconButton>
            </header>
            {#each $months as month}
                <table {...$grid} use:$grid.action class="w-full text-center">
                    <thead aria-hidden="true">
                        <tr>
                            {#each $weekdays as day}
                                <th>
                                    {day}
                                </th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each month.weeks as days}
                            <tr>
                                {#each days as date}
                                    <td
                                        role="gridcell"
                                        aria-disabled={$isDateDisabled(date) ||
                                        $isDateUnavailable(date)
                                            ? true
                                            : undefined}
                                        class="aria-disabled:text-base-fg-ghost group rounded-lg py-px"
                                    >
                                        <div
                                            use:melt={$cell(date, month.value)}
                                            class={[
                                                'relative flex size-8 select-none items-center justify-center rounded-md transition',
                                                'data-[selected]:bg-primary-1/10 data-[selected]:text-primary-1 group-[:not([aria-disabled])]:hover:bg-base-hover'
                                            ]}
                                        >
                                            {date.day}
                                        </div>
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {/each}
        </div>
    </Popover>
{/if}
