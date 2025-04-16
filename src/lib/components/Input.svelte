<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { Action } from 'svelte/action';
    import type { HTMLInputAttributes } from 'svelte/elements';
    import { noop } from '../utils';

    interface Props extends Omit<HTMLInputAttributes, 'size'> {
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
        ref?: HTMLInputElement;
        errors?: string[];
        useField?: Action;
        action?: Action;
        size?: 'sm';
    }

    let {
        value = $bindable(),
        melt: useMelt,
        ref = $bindable(),
        errors,
        useField = noop,
        action = noop,
        size,
        ...props
    }: Props = $props();
    let initial = $state.snapshot(value);
    let dirty = $state(false);

    $effect.pre(() => {
        if (!dirty && value !== initial) {
            dirty = true;
        }
    });

    const meltAction = $derived(useMelt ? (node: HTMLElement) => useMelt.action(node) : () => {});
</script>

<input
    bind:this={ref}
    {...props}
    bind:value
    class={clsx('c-input', size && `c-input--${size}`, props.class)}
    {...useMelt}
    use:meltAction
    use:useField
    use:action
/>
