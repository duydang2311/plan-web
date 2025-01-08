<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';

    const { children, class: cls, ...props }: HTMLAttributes<HTMLElement> = $props();
</script>

<main class={['c-main', cls]} {...props}>
    {@render children?.()}
</main>
