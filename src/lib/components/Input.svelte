<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { HTMLInputAttributes } from 'svelte/elements';
    import Errors from './Errors.svelte';

    interface Props extends HTMLInputAttributes {
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
        ref?: HTMLInputElement;
        errors?: string[];
    }

    let {
        value = $bindable(),
        melt: useMelt,
        ref = $bindable(),
        errors,
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
    $inspect(dirty, props.name);
</script>

<input
    bind:this={ref}
    aria-invalid={dirty && errors?.length ? true : undefined}
    {...props}
    bind:value
    class={clsx('c-input', props.class)}
    {...useMelt}
    use:meltAction
/>
<Errors errors={dirty ? errors : undefined} />
