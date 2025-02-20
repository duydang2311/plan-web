<script lang="ts">
    import { createAccordion, melt } from '@melt-ui/svelte';
    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';

    type AccordionReturn = ReturnType<typeof createAccordion>;
    type Item = Parameters<Parameters<AccordionReturn['elements']['item']['subscribe']>[0]>[0];
    type Content = Parameters<
        Parameters<AccordionReturn['elements']['content']['subscribe']>[0]
    >[0];
    type Trigger = Parameters<
        Parameters<AccordionReturn['elements']['trigger']['subscribe']>[0]
    >[0];
    type IsSelected = Parameters<
        Parameters<AccordionReturn['helpers']['isSelected']['subscribe']>[0]
    >[0];
    type Props = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
        children: Snippet<
            [
                {
                    item: Item;
                    content: Content;
                    trigger: Trigger;
                    helpers: {
                        isSelected: IsSelected;
                    };
                }
            ]
        >;
    };

    const { children, ...props }: Props = $props();
    const {
        elements: { content, item, trigger, root },
        helpers: { isSelected }
    } = createAccordion();
</script>

<div {...props} use:melt={$root}>
    {@render children({
        item: $item,
        content: $content,
        trigger: $trigger,
        helpers: {
            isSelected: $isSelected
        }
    })}
</div>
