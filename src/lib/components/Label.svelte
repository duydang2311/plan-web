<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLLabelAttributes } from 'svelte/elements';

	type Props = HTMLLabelAttributes;

	const { children, ...props }: Props = $props();
</script>

<!-- svelte-ignore a11y_label_has_associated_control -->
<label {...props} class={clsx('c-label', props.class)}>
	{#if children}
		{@render children()}
	{/if}
</label>
