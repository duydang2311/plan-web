<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLTableAttributes } from 'svelte/elements';

	type Props = HTMLTableAttributes;

	const { children, ...props }: Props = $props();
</script>

<table {...props} class={clsx('c-table', props.class)}>
	{#if children}
		{@render children()}
	{/if}
</table>
