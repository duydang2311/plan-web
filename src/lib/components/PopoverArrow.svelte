<script lang="ts">
	import type { AnyMeltElement } from '@melt-ui/svelte';
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
	}

	const { melt, ...props }: Props = $props();
	const meltAction = $derived(melt ? melt.action : () => {});
</script>

<div {...props} class={clsx('c-popover--arrow', props.class)} {...melt} use:meltAction>
	{@render props.children?.()}
</div>
