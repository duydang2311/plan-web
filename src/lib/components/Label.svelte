<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { HTMLLabelAttributes } from 'svelte/elements';

    interface Props extends HTMLLabelAttributes {
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
    }

    const { children, melt: useMelt, ...props }: Props = $props();

    const meltAction = $derived(useMelt ? (node: HTMLElement) => useMelt.action(node) : () => {});
</script>

<label {...props} class={clsx('c-label', props.class)} {...useMelt ?? {}} use:meltAction>
    {#if children}
        {@render children()}
    {/if}
</label>
