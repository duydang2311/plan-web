<script lang="ts" module>
    export interface DialogProps {
        options?: CreateDialogProps;
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
    import type { CreateDialogProps } from '@melt-ui/svelte';

    const { options, children }: DialogProps = $props();
    const {
        elements: { overlay, content, title, description, close, portalled },
        states: { open }
    } = createDialog(options);
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
