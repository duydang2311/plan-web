<script lang="ts">
    import {
        getIssuePriorityColor,
        getIssuePriorityLabel
    } from '~/lib/features/issues/utils';
    import { type IssuePriority } from '~/lib/models/issue';

    const { priority }: { priority: IssuePriority } = $props();
    const color = $derived(getIssuePriorityColor(priority));
</script>

<div
    class="bg-(--_bg) text-(--_text) rounded-full px-2 text-center text-nowrap"
    style="--_bg: color-mix(in oklch, {color} 10%, transparent); --_text: {color};"
>
    <span>{getIssuePriorityLabel(priority)}</span>
</div>
