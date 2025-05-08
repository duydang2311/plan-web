<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';

    const { class: cls, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...props} class={['c-next-select--option', cls]}>
    {@render children?.()}
</div>
