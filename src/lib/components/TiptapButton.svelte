<script lang="ts">
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import type { MouseEventHandler } from 'svelte/elements';

	interface Props {
		isActive?: boolean;
		onclick?: MouseEventHandler<HTMLButtonElement>;
		children?: Snippet;
	}

	const { isActive, onclick, children }: Props = $props();
</script>

<button type="button" {onclick} class={clsx('c-tiptap--button', isActive && 'active')}>
	{@render children?.()}
</button>
