<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = HTMLInputAttributes;

	let { value = $bindable(), ...props }: Props = $props();
	let element: HTMLInputElement;

	$effect(() => {
		if (document.activeElement !== element && props['aria-invalid']) {
			element.focus();
		}
	});
</script>

<input bind:this={element} {...props} bind:value class={clsx('c-input', props.class)} />
