<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import Logo from './Logo.svelte';
    import clsx from 'clsx';

    type Props = HTMLAttributes<HTMLDivElement>;

    const { ...props }: Props = $props();
</script>

<div
    {...props}
    class={clsx('text-base-fg-1 flex w-fit select-none items-center gap-2', props.class)}
>
    <Logo class="h-full w-auto" />
    <p class="font-display text-5xl font-black tracking-tight">Keptrack</p>
</div>
