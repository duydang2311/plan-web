<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { HTMLInputAttributes } from 'svelte/elements';
    import type { Action } from 'svelte/action';
    import { noop } from '../utils';

    interface Props extends HTMLInputAttributes {
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
        ref?: HTMLInputElement;
        errors?: string[];
        useField?: Action;
        action?: Action;
    }

    let {
        value = $bindable(),
        melt: useMelt,
        ref = $bindable(),
        errors,
        useField = noop,
        action = noop,
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
    class={clsx('c-input', props.class)}
    {...useMelt}
    use:meltAction
    use:useField
    use:action
/>
