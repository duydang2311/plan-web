<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { Action } from 'svelte/action';
    import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

    type Props = (
        | ({ as: 'link' } & HTMLAnchorAttributes & { disabled?: boolean })
        | ({ as?: never } & HTMLButtonAttributes)
    ) & {
        variant?: 'base' | 'primary' | 'negative' | 'positive';
        filled?: boolean;
        outline?: boolean;
        flat?: boolean;
        size?: 'sm';
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
        action?: Action;
    };

    const {
        variant = 'primary',
        filled = true,
        outline = false,
        size,
        melt: useMelt,
        action = () => {},
        children,
        flat,
        ...props
    }: Props = $props();
    const meltAction = $derived(useMelt ? (node: HTMLElement) => useMelt.action(node) : () => {});
</script>

{#if props.as === 'link'}
    <a
        {...props}
        class={clsx(
            'c-button block',
            `c-button--${variant}`,
            filled && 'c-button--filled',
            outline && 'c-button--outline',
            flat && 'c-button--flat',
            size && 'c-button--sm',
            props.class
        )}
        aria-disabled={props.disabled ? true : undefined}
        {...useMelt ?? {}}
        use:meltAction
        use:action
    >
        {#if children}
            {@render children()}
        {/if}
    </a>
{:else}
    <button
        {...props}
        class={clsx(
            'c-button',
            `c-button--${variant}`,
            filled && 'c-button--filled',
            outline && 'c-button--outline',
            flat && 'c-button--flat',
            size && 'c-button--sm',
            props.class
        )}
        {...useMelt ?? {}}
        use:meltAction
        use:action
    >
        {#if children}
            {@render children()}
        {/if}
    </button>
{/if}
