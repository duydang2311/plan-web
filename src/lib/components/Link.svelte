<script lang="ts">
    import clsx from 'clsx';
    import type { HTMLAnchorAttributes } from 'svelte/elements';

    type Props = HTMLAnchorAttributes;

    const { children, ...props }: Props = $props();
</script>

<a {...props} class={clsx('c-link', props.class)}>
    {@render children?.()}
</a>
