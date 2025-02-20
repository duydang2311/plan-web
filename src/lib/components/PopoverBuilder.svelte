<script lang="ts">
    import { createPopover, type CreatePopoverProps } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';

    type PopoverReturn = ReturnType<typeof createPopover>;
    type Trigger = Parameters<Parameters<PopoverReturn['elements']['trigger']['subscribe']>[0]>[0];
    type Content = Parameters<Parameters<PopoverReturn['elements']['content']['subscribe']>[0]>[0];
    type Arrow = Parameters<Parameters<PopoverReturn['elements']['arrow']['subscribe']>[0]>[0];
    type Close = Parameters<Parameters<PopoverReturn['elements']['close']['subscribe']>[0]>[0];

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
