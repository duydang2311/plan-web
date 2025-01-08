<script lang="ts">
    import { DateTime, type ToRelativeOptions } from 'luxon';
    import { onMount } from 'svelte';

    const { time, options }: { time: string | DateTime; options?: ToRelativeOptions } = $props();
    let format = $state.raw(
        (typeof time === 'string' ? DateTime.fromISO(time) : time).toRelative(options)
    );

    onMount(() => {
        const interval = setInterval(() => {
            format = (typeof time === 'string' ? DateTime.fromISO(time) : time).toRelative(options);
        }, 1000);
        return () => {
            clearInterval(interval);
        };
    });
</script>

{format}
