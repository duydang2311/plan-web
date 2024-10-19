<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { HTMLInputAttributes } from 'svelte/elements';

    interface Props extends HTMLInputAttributes {
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
        ref?: HTMLInputElement;
    }

    let { value = $bindable(), melt: useMelt, ref = $bindable(), ...props }: Props = $props();

    $effect(() => {
        if (props['aria-invalid'] && ref && document.activeElement !== ref) {
            ref.focus();
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
/>
