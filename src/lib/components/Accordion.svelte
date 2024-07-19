<script lang="ts">
	import { createAccordion, melt } from '@melt-ui/svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	type Item = Parameters<Parameters<typeof item.subscribe>[0]>[0];
	type Content = Parameters<Parameters<typeof content.subscribe>[0]>[0];
	type Trigger = Parameters<Parameters<typeof trigger.subscribe>[0]>[0];
	type IsSelected = Parameters<Parameters<typeof isSelected.subscribe>[0]>[0];
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
