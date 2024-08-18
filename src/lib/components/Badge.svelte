<script lang="ts">
    import clsx from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';

    interface Props extends HTMLAttributes<HTMLDivElement> {
        variant?: 'info';
        size?: 'sm';
    }

    const { size, children, variant, ...props }: Props = $props();
</script>

<div
    {...props}
    class={clsx('c-badge', variant && `c-badge--${variant}`, size && `c-badge--${size}`)}
>
    {@render children?.()}
</div>
