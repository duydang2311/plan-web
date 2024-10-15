<script lang="ts">
    import clsx from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';

    interface Props extends HTMLAttributes<HTMLTableRowElement> {
        ref?: HTMLTableRowElement;
    }

    let { children, ref = $bindable(), ...props }: Props = $props();
</script>

<tr bind:this={ref} class={clsx('c-table--row', props.class)}>
    {#if children}
        {@render children()}
    {/if}
</tr>
