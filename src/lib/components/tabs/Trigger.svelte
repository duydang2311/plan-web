<script lang="ts">
    import type { HTMLButtonAttributes } from 'svelte/elements';

    const { class: cls, children, ...props }: HTMLButtonAttributes = $props();
</script>

<button {...props} class={['c-tab--trigger', cls]}>
    {@render children?.()}
</button>
