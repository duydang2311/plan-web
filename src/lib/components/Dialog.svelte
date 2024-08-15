<script lang="ts" context="module">
    export interface DialogProps {
        defaultOpen?: boolean;
        role?: 'dialog' | 'alertdialog';
        onClose?: () => void;
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

    type T = ReturnType<typeof createDialog>;
    type Title = Parameters<Parameters<T['elements']['title']['subscribe']>[0]>[0];
    type Description = Parameters<Parameters<T['elements']['description']['subscribe']>[0]>[0];
    type Content = Parameters<Parameters<T['elements']['content']['subscribe']>[0]>[0];
    type Close = Parameters<Parameters<T['elements']['close']['subscribe']>[0]>[0];
    type Overlay = Parameters<Parameters<T['elements']['overlay']['subscribe']>[0]>[0];
</script>

<script lang="ts">
    import { createDialog, melt } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';
    import type { Writable } from 'svelte/store';

    const { defaultOpen, children, open: __open, role, onClose }: DialogProps = $props();
    const {
        elements: { overlay, content, title, description, close, portalled },
        states: { open }
    } = createDialog({
        role,
        forceVisible: true,
        defaultOpen,
        open: __open,
        onOpenChange: ({ next }) => {
            if (next === false) onClose?.();
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
