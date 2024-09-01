<script lang="ts">
    import { createCollapsible, type CreateCollapsibleProps } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';

    type T = ReturnType<typeof createCollapsible>;
    type Root = Parameters<Parameters<T['elements']['root']['subscribe']>[0]>[0];
    type Content = Parameters<Parameters<T['elements']['content']['subscribe']>[0]>[0];
    type Trigger = Parameters<Parameters<T['elements']['trigger']['subscribe']>[0]>[0];

    interface Props {
        options?: CreateCollapsibleProps;
        children: Snippet<[{ root: Root; content: Content; trigger: Trigger }]>;
    }

    const { options, children }: Props = $props();

    const {
        elements: { root, content, trigger }
    } = createCollapsible(options);
</script>

{@render children({
    root: $root,
    content: $content,
    trigger: $trigger
})}
