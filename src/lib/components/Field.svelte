<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement>;

	const { children, ...props }: Props = $props();
</script>

<div {...props} class={clsx('space-y-1', props.class)}>
	{#if children}
		{@render children()}
	{/if}
</div>
