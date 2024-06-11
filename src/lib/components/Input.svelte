<script lang="ts">
	import clsx from 'clsx';
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends HTMLInputAttributes {}

	let { value = $bindable(), ...props }: Props = $props();
</script>

<input {...props} bind:value class={clsx('c-input', props.class)} />
