<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { HTMLButtonAttributes } from 'svelte/elements';

    interface Props extends HTMLButtonAttributes {
        variant?: 'base' | 'negative';
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
    }

    const { variant = 'base', melt: useMelt, children, ...props }: Props = $props();
    const meltAction = $derived(useMelt ? (node: HTMLElement) => useMelt.action(node) : () => {});
</script>

<button
    {...props}
    class={clsx('c-icon-button', `c-icon-button--${variant}`, props.class)}
    {...useMelt ?? {}}
    use:meltAction
>
    <div class="inner relative">
        <div class="hover"></div>
        {@render children?.()}
    </div>
</button>
