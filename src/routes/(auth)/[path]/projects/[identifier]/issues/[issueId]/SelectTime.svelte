<script lang="ts" module>
    import { DateTime } from 'luxon';

    const times = new Array(24).fill(0).flatMap((_, i) => {
        return [
            DateTime.fromObject({ hour: i, minute: 0 }),
            DateTime.fromObject({ hour: i, minute: 30 })
        ];
    });
</script>

<script lang="ts">
    import { Button } from '~/lib/components';
    import Select from '~/lib/components/select';

    const {
        value,
        disabled,
        onValueChange
    }: {
        value: string | undefined;
        disabled: boolean;
        onValueChange: (value: string | undefined) => void;
    } = $props();

    const select = new Select.Builder({
        forceVisible: true,
        value: () => value,
        onValueChange: (a) => {
            onValueChange(a);
        }
    });
</script>

<div class="mb-2 flex gap-2">
    {#each ['08:00 AM', '01:00 PM', '05:00 PM'] as time}
        <Button
            type="button"
            variant="base"
            size="sm"
            disabled={disabled || value === time}
            onclick={() => {
                onValueChange(time);
            }}
        >
            {time}
        </Button>
    {/each}
</div>
<div>
    <Button
        {...select.trigger}
        type="button"
        variant="base"
        size="sm"
        {disabled}
        class="flex items-center justify-between px-2"
    >
        <span>
            {#if value == null}
                No time
            {:else}
                {value}
            {/if}
        </span>
        <Select.Icon />
    </Button>
    {#if select.open}
        <Select {...select.content} class="max-h-96 overflow-auto">
            <ol>
                {#each times as time (time.hour + time.minute)}
                    {@const value = time.toFormat('hh:mm a')}
                    <li>
                        <Select.Option {...select.getOption(value)}>
                            {#if select.isSelected(value)}
                                <Select.Check />
                            {/if}
                            {value}
                        </Select.Option>
                    </li>
                {/each}
            </ol>
        </Select>
    {/if}
</div>
