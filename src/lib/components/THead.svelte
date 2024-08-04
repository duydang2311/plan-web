<script lang="ts">
    import clsx from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';

    type Props = HTMLAttributes<HTMLHeadElement>;

    const { children, ...props }: Props = $props();
</script>

<thead {...props} class={clsx('c-table--thead', props.class)}>
    {#if children}
        {@render children()}
    {/if}
</thead>
