<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import Logo from './Logo.svelte';
    import clsx from 'clsx';

    type Props = HTMLAttributes<HTMLDivElement>;

    const { ...props }: Props = $props();
</script>

<div
    {...props}
    class={clsx(
        'select-none flex items-center w-fit gap-2 text-base-fg-1 text-h1 font-display font-bold tracking-tighter',
        props.class
    )}
>
    <Logo class="h-full w-auto" />
    <p>plan</p>
</div>
