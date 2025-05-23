<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import Logo from './Logo.svelte';
    import clsx from 'clsx';

    type Props = HTMLAttributes<HTMLDivElement>;

    const { ...props }: Props = $props();
</script>

<div
    {...props}
    class={clsx('text-base-fg-1 flex w-fit select-none items-baseline gap-1', props.class)}
>
    <Logo class="h-full w-auto" />
    <p class="font-display text-7xl font-black tracking-tight leading-none">konekt</p>
</div>
