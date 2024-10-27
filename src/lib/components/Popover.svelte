<script lang="ts">
    import type { AnyMeltElement } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { HTMLAttributes } from 'svelte/elements';
    import { popover, tsap } from '../utils/transition';

    interface Props extends HTMLAttributes<HTMLDivElement> {
        melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
    }

    const { melt, ...props }: Props = $props();
    const meltAction = $derived(melt ? melt.action : () => {});
</script>

<div class="lg:pr-2" {...melt} use:meltAction in:tsap={popover.in} out:tsap={popover.out}>
    <div {...props} class={clsx('c-popover', props.class)}>
        {@render props.children?.()}
    </div>
</div>
