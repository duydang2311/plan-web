<script lang="ts">
    import { createPopover, type CreatePopoverProps } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';

    type Trigger = Parameters<Parameters<typeof trigger.subscribe>[0]>[0];
    type Content = Parameters<Parameters<typeof content.subscribe>[0]>[0];
    type Arrow = Parameters<Parameters<typeof arrow.subscribe>[0]>[0];
    type Close = Parameters<Parameters<typeof close.subscribe>[0]>[0];

    interface Props {
        children: Snippet<[{ trigger: Trigger; content: Content; arrow: Arrow; close: Close }]>;
        options?: CreatePopoverProps;
    }

    let { options, children }: Props = $props();
    const {
        elements: { trigger, content, arrow, close }
    } = createPopover(options);
</script>

{@render children({ trigger: $trigger, content: $content, arrow: $arrow, close: $close })}
