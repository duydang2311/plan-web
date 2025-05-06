<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';

    const { class: cls, ...props }: Omit<HTMLAttributes<HTMLDivElement>, 'children'> = $props();
</script>

<div {...props} class={['c-popover--arrow', cls]}></div>
