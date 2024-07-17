<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	type Props = Exclude<HTMLTextareaAttributes, 'children'>;

	let { value = $bindable(), ...props }: Props = $props();
	let element: HTMLTextAreaElement;

	$effect(() => {
		if (document.activeElement !== element && props['aria-invalid']) {
			element.focus();
		}
	});
</script>

<textarea bind:this={element} {...props} bind:value class={clsx('c-input', props.class)}></textarea>
