<script lang="ts">
    import { CalendarDate, type DateValue } from '@internationalized/date';
    import { createDatePicker, melt } from '@melt-ui/svelte';
    import { DateTime } from 'luxon';
    import { Button, Field, IconButton, Label, toast } from '~/lib/components';
    import { IconCalendarRange, IconChevronLeft, IconChevronRight } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import SelectTime from './SelectTime.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { attempt } from '~/lib/utils/try';
    import { errorCodes } from '~/lib/models/errors';

    let {
        name,
        label,
        issueId,
        value: dateTime = $bindable(),
        defaultTime,
        highlightDate,
        isDateDisabled: propsIsDateDisabled
    }: {
        name: string;
        label: string;
        issueId: string;
        value: DateTime | undefined;
        defaultTime: string;
        highlightDate: DateTime | undefined;
        isDateDisabled: (date: DateValue) => boolean;
    } = $props();

    const { api } = useRuntime();
    const {
        elements: { calendar, grid, prevButton, heading, nextButton, cell },
        states: { value, headingValue, months, weekdays },
        helpers: { isDateDisabled, isDateUnavailable }
    } = createDatePicker({
        defaultValue: dateTime
            ? new CalendarDate(dateTime.year, dateTime.month, dateTime.day)
            : undefined,
        isDateDisabled: propsIsDateDisabled,
        onValueChange: ({ next }) => {
            if (
                next &&
                dateTime &&
                next.compare(new CalendarDate(dateTime.year, dateTime.month, dateTime.day)) === 0
            ) {
                return next;
            }
            if (next) {
                dateTime = DateTime.fromFormat(time, 'hh:mm a').set({
                    day: next.day,
                    month: next.month,
                    year: next.year
                });
                patchTime(dateTime);
            }
            return next;
        }
    });
    const popover = new Popover.Builder({
        forceVisible: true,
        floatingConfig: {
            computePosition: {
                placement: 'bottom-end'
            },
            sameWidth: true,
            shift: {
                padding: {
                    right: 16
                }
            }
        }
    });
    let time = $state.raw<string>(defaultTime);

    export const invalidate = () => {
        if (dateTime) {
            $value = new CalendarDate(dateTime.year, dateTime.month, dateTime.day);
            time = dateTime.toFormat('hh:mm a');
        }
    };

    const patchTime = async (dateTime: DateTime) => {
        const patchAttempt = await attempt.promise(() =>
            api.patch(`issues/${issueId}`, {
                body: { patch: { [name]: dateTime.toUTC().toISO(), timelineZone: dateTime.zone.name } }
            })
        )(errorCodes.fromFetch);

        if (patchAttempt.failed || !patchAttempt.data.ok) {
            toast({
                type: 'negative',
                body: `Something went wrong while updating ${label.toLocaleLowerCase()}.`,
                footer: `Error code: ${patchAttempt.failed ? patchAttempt.error : patchAttempt.data.status + ''}`
            });
            return;
        }

        toast({
            type: 'positive',
            body: `${label} updated successfully.`
        });
    };
</script>

<Field>
    <Label for={popover.trigger.id} class="capitalize">{label}</Label>
    <Button {...popover.trigger} type="button" variant="base">
        <span class="flex items-center gap-2">
            <IconCalendarRange />
            {dateTime ? dateTime.toLocaleString(DateTime.DATETIME_MED) : 'Select date and time'}
        </span>
    </Button>
</Field>
{#if popover.open}
    <Popover.Wrapper {...popover.content}>
        <Popover class="p-2">
            <div use:melt={$calendar} class="w-full">
                <header class="mb-4 flex items-center justify-between">
                    <IconButton melt={$prevButton}>
                        <IconChevronLeft />
                    </IconButton>
                    <div use:melt={$heading}>
                        {$headingValue}
                    </div>
                    <IconButton melt={$nextButton}>
                        <IconChevronRight />
                    </IconButton>
                </header>
                {#each $months as month}
                    <table use:melt={$grid} class="w-full text-center">
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
                                        {@const isHighlighted =
                                            highlightDate &&
                                            date.day === highlightDate.day &&
                                            date.month === highlightDate.month &&
                                            date.year === highlightDate.year}
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
                                                data-custom-highlight={isHighlighted
                                                    ? true
                                                    : undefined}
                                                class={[
                                                    'relative flex h-8 select-none items-center justify-center rounded-md transition',
                                                    'data-[selected]:bg-primary-1/10 data-[selected]:text-primary-1 group-[:not([aria-disabled])]:hover:bg-base-hover',
                                                    'data-[custom-highlight]:not-[[data-selected]]:bg-base-selected data-[custom-highlight]:not-[[data-selected]]:text-base-fg-1'
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
            <div class="mt-2">
                <SelectTime
                    value={time}
                    onValueChange={(a) => {
                        console.log('onValueChange', a);
                        if (a == null || dateTime == null) {
                            return;
                        }

                        time = a;
                        const d = DateTime.fromFormat(a, 'hh:mm a');
                        dateTime = dateTime.set({
                            hour: d.hour,
                            minute: d.minute
                        });
                        patchTime(dateTime);
                    }}
                    disabled={$value == null}
                />
            </div>
        </Popover>
    </Popover.Wrapper>
{/if}
