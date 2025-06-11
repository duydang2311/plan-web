<script lang="ts">
    import { DateFormatter, getLocalTimeZone } from '@internationalized/date';
    import { createDatePicker, melt } from '@melt-ui/svelte';
    import { DateTime } from 'luxon';
    import { Button, Field, IconButton, Label } from '~/lib/components';
    import Errors from '~/lib/components/Errors.svelte';
    import { IconCalendar, IconChevronLeft, IconChevronRight } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import type { HelperField } from '~/lib/utils/form.svelte';
    import { watch } from '~/lib/utils/runes.svelte';

    const { field }: { field: HelperField } = $props();

    const {
        elements: { calendar, grid, prevButton, heading, nextButton, cell },
        states: { value, headingValue, months, weekdays },
        helpers: { isDateDisabled, isDateUnavailable }
    } = createDatePicker();
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

    const date = $derived(
        $value ? DateTime.fromJSDate($value.toDate(getLocalTimeZone())).endOf('day') : null
    );

    watch(() => date)(() => {
        field.state.value = date ? date.toUTC().toISO()! : '';
        if (!field.state.dirty) {
            field.state.dirty = true;
        } else if (field.state.dirty) {
            const errors = field.validate();
            field.setErrors(errors);
        }
    });
</script>

<Field>
    {#if date}
        <input type="hidden" name="endTime" value={date.toUTC().toISO()} />
        <input type="hidden" name="endTimeZone" value={getLocalTimeZone()} />
    {/if}
    <Label for={popover.trigger.id} class="capitalize">Due date</Label>
    <Button
        {...popover.trigger}
        data-custom-state={popover.open ? 'open' : undefined}
        type="button"
        variant="base"
        outline
        class="px-2 normal-case"
        aria-invalid={field.state.errors ? true : undefined}
    >
        <span class="flex items-center gap-2">
            <IconCalendar />
            {$value
                ? new DateFormatter(navigator.language, { dateStyle: 'long' }).format(
                      $value.toDate(getLocalTimeZone())
                  )
                : 'Select due date'}
        </span>
    </Button>
    <Errors errors={field.state.errors} />
</Field>
{#if popover.open}
    <Popover {...popover.content} class="p-2">
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
                                                'relative flex h-8 select-none items-center justify-center rounded-md transition',
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
