<script lang="ts">
	import type { AnyMeltElement } from '@melt-ui/svelte';
	import clsx from 'clsx';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';

	type Props = (
		| ({ as: 'link' } & HTMLAnchorAttributes)
		| ({ as?: never } & HTMLButtonAttributes)
	) & {
		variant?: 'base' | 'primary';
		outline?: boolean;
		size?: 'sm';
		melt?: Parameters<Parameters<AnyMeltElement['subscribe']>[0]>[0];
	};

	const { variant = 'primary', outline, size, melt: useMelt, children, ...props }: Props = $props();
	const meltAction = $derived(useMelt ? (node: HTMLElement) => useMelt.action(node) : () => {});
</script>

{#if props.as === 'link'}
	<a
		{...props}
		class={clsx(
			'block c-button',
			`c-button--${variant}`,
			outline && 'c-button--outline',
			size && 'c-button--sm',
			props.class
		)}
		{...useMelt ?? {}}
		use:meltAction
	>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<button
		{...props}
		class={clsx(
			'c-button',
			`c-button--${variant}`,
			outline && 'c-button--outline',
			size && 'c-button--sm',
			props.class
		)}
		{...useMelt ?? {}}
		use:meltAction
	>
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}
