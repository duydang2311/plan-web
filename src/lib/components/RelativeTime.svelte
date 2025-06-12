<script lang="ts" module>
    interface Item {
        time: DateTime;
        options?: ToRelativeOptions & { capitalize?: boolean };
        format: string;
    }

    let interval = 0;
    const refs: Ref<Item>[] = [];
    export const add = (ref: Ref<Item>) => {
        refs.push(ref);
        if (interval === 0) {
            interval = setInterval(update, 1000) as unknown as number;
        }
    };
    export const remove = (ref: Ref<Item>) => {
        const index = refs.findIndex((a) => a === ref);
        if (index !== -1) {
            refs.splice(index, 1);
        }
        if (refs.length === 0) {
            clearInterval(interval);
            interval = 0;
        }
    };
    export const update = () => {
        for (const ref of refs) {
            if (ref.value) {
                ref.value = {
                    ...ref.value,
                    format: formatRelativeDateTimeUi(ref.value.time, ref.value.options) ?? 'N/A'
                };
            }
        }
    };
</script>

<script lang="ts">
    import { DateTime, type ToRelativeOptions } from 'luxon';
    import { onMount } from 'svelte';
    import { createRef, watch, type Ref } from '../utils/runes.svelte';
    import { formatRelativeDateTimeUi } from '../utils/time';

    let {
        time,
        options
    }: { time: string | DateTime; options?: ToRelativeOptions & { capitalize?: boolean } } =
        $props();

    if (typeof time === 'string') {
        time = DateTime.fromISO(time);
    }

    const ref = createRef({
        time,
        options,
        format: formatRelativeDateTimeUi(time, options) ?? 'N/A'
    });

    watch.pre(() => time)(() => {
        const normalized = typeof time === 'string' ? DateTime.fromISO(time) : time;
        ref.value = {
            time: normalized,
            options,
            format: formatRelativeDateTimeUi(normalized, options) ?? 'N/A'
        };
    });

    onMount(() => {
        add(ref);
        return () => {
            remove(ref);
        };
    });
</script>

{#if ref.value}
    <time datetime={ref.value.time.toFormat('yyyy-MM-dd HH:mm')}>
        {ref.value.format}
    </time>
{/if}
