<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary';
	}

	const { variant = 'primary', children, ...props }: Props = $props();
</script>

<button {...props} class={clsx('c-button', `c-button--${variant}`, props.class)}>
	{#if children}
		{@render children()}
	{/if}
</button>
