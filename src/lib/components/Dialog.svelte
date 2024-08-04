<script lang="ts">
    import { createDialog, melt } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';
    import type { Writable } from 'svelte/store';

    interface Props {
        defaultOpen?: boolean;
        role?: 'dialog' | 'alertdialog';
        onclose?: () => void;
        children?: Snippet<
            [
                {
                    title: Title;
                    description: Description;
                    content: Content;
                    close: Close;
                    overlay: Overlay;
                }
            ]
        >;
        open?: Writable<boolean>;
    }

    type Title = Parameters<Parameters<typeof title.subscribe>[0]>[0];
    type Description = Parameters<Parameters<typeof description.subscribe>[0]>[0];
    type Content = Parameters<Parameters<typeof content.subscribe>[0]>[0];
    type Close = Parameters<Parameters<typeof close.subscribe>[0]>[0];
    type Overlay = Parameters<Parameters<typeof overlay.subscribe>[0]>[0];

    const { defaultOpen, children, open: __open, role, onclose }: Props = $props();
    const {
        elements: { overlay, content, title, description, close, portalled },
        states: { open }
    } = createDialog({
        role,
        forceVisible: true,
        defaultOpen,
        open: __open,
        onOpenChange: ({ next }) => {
            if (next === false) onclose?.();
            return next;
        }
    });
</script>

{#if $open}
    <div use:melt={$portalled}>
        {@render children?.({
            title: $title,
            description: $description,
            content: $content,
            close: $close,
            overlay: $overlay
        })}
    </div>
{/if}
