<script lang="ts">
    import { createPopover, createSync } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';

    type Trigger = Parameters<Parameters<typeof trigger.subscribe>[0]>[0];
    type Content = Parameters<Parameters<typeof content.subscribe>[0]>[0];
    type Arrow = Parameters<Parameters<typeof arrow.subscribe>[0]>[0];
    type Close = Parameters<Parameters<typeof close.subscribe>[0]>[0];

    interface Props {
        open?: boolean;
        children: Snippet<[{ trigger: Trigger; content: Content; arrow: Arrow; close: Close }]>;
    }

    const {
        elements: { trigger, content, arrow, close },
        states
    } = createPopover({
        forceVisible: true
    });

    let { open = $bindable(false), children }: Props = $props();
    const sync = createSync(states);

    $effect(() => {
        sync.open(open, (v) => (open = v));
    });
</script>

{@render children({ trigger: $trigger, content: $content, arrow: $arrow, close: $close })}
