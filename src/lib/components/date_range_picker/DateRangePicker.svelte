<script lang="ts">
    import {
        createDateRangePicker,
        type CreateDateRangePickerProps,
        type DateRangePicker
    } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';

    const {
        options,
        children
    }: { children: Snippet<[DateRangePicker]>; options?: CreateDateRangePickerProps } = $props();

    const picker = createDateRangePicker(options);
</script>

{@render children(picker)}
