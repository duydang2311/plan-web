<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLTableRowElement>;

	const { children, ...props }: Props = $props();
</script>

<tr class={clsx('c-table--row', props.class)}>
	{#if children}
		{@render children()}
	{/if}
</tr>
