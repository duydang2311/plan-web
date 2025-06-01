<script lang="ts">
    import { getStatusColor } from '~/lib/features/status/utils';
    import type { WorkspaceStatus } from '~/lib/models/status';

    const { status }: { status: Pick<WorkspaceStatus, 'value' | 'color' | 'category'> } = $props();
    const color = $derived(getStatusColor(status));
</script>

<div
    class="bg-(--_bg) text-(--_text) rounded-full px-2"
    style="--_bg: color-mix(in oklch, {color} 10%, transparent); --_text: {color};"
>
    <span>{status.value}</span>
</div>
