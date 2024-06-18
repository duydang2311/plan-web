<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLAnchorAttributes } from 'svelte/elements';

	type Props = HTMLAnchorAttributes;

	const { children, ...props }: Props = $props();
</script>

<a {...props} class={clsx('c-link', props.class)}>
	{#if children}
		{@render children()}
	{/if}
</a>
