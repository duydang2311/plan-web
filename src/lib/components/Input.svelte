<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { HTMLInputAttributes } from 'svelte/elements';

    interface Props extends HTMLInputAttributes {
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
    }

    let { value = $bindable(), melt: useMelt, ...props }: Props = $props();
    let element: HTMLInputElement;

    $effect(() => {
        if (document.activeElement !== element && props['aria-invalid']) {
            element.focus();
        }
    });

    const meltAction = $derived(useMelt ? (node: HTMLElement) => useMelt.action(node) : () => {});
</script>

<input
    bind:this={element}
    {...props}
    bind:value
    class={clsx('c-input', props.class)}
    {...useMelt}
    use:meltAction
/>
