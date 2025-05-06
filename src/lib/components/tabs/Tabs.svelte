<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';

    const { class: cls, children, ...props }: HTMLAttributes<HTMLDivElement> = $props();
</script>

<div {...props} class={['c-tab', cls]}>
    {@render children?.()}
</div>
