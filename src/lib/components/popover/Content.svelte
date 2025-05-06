<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';

    const { class: cls, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...props} class={['c-popover', cls]}>
    {@render children?.()}
</div>
