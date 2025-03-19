<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { Action } from 'svelte/action';
    import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

    type Props = (
        | ({ as: 'link' } & HTMLAnchorAttributes)
        | ({ as?: never } & HTMLButtonAttributes)
    ) & {
        variant?: 'base' | 'positive' | 'negative';
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
        action?: Action;
    };

    const {
        variant = 'base',
        melt: useMelt,
        children,
        action = () => {},
        ...props
    }: Props = $props();
    const meltAction = $derived(useMelt ? (node: HTMLElement) => useMelt.action(node) : () => {});
</script>

{#if props.as === 'link'}
    <a
        {...props}
        class={clsx('c-icon-button', `c-icon-button--${variant}`, props.class)}
        {...useMelt ?? {}}
        use:meltAction
        use:action
    >
        {@render children?.()}
    </a>
{:else}
    <button
        {...props}
        class={clsx('c-icon-button', `c-icon-button--${variant}`, props.class)}
        {...useMelt ?? {}}
        use:meltAction
        use:action
    >
        {@render children?.()}
    </button>
{/if}
