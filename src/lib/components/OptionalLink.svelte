<script lang="ts">
    import clsx from 'clsx';
    import type { HTMLAnchorAttributes } from 'svelte/elements';

    type Props = HTMLAnchorAttributes;

    const { children, href, ...props }: Props = $props();
</script>

{#if href}
    <a {href} {...props} class={clsx('c-link', props.class)}>
        {@render children?.()}
    </a>
{:else}
    {@render children?.()}
{/if}
