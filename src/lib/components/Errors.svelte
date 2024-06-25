<script lang="ts">
	import clsx from 'clsx';
	import Flippable from './Flippable.svelte';

	interface Props {
		errors?: string[];
		errorMap?: Record<string, string>;
		class?: string;
	}

	const { errors = [], errorMap, ...props }: Props = $props();
</script>

<Flippable
	on={errors.length}
	aria-hidden={errors.length === 0 ? true : undefined}
	class={props.class}
>
	<ol
		class={clsx(
			'm-0 p-0 text-negative-1 text-sm font-medium list-none',
			errors.length === 1 ? 'list-none' : 'list-inside'
		)}
	>
		{#each errors as error}
			{@const message = errorMap?.[error] ?? error}
			<li><em>{message}{!message.endsWith('.') && '.'}</em></li>
		{/each}
	</ol>
</Flippable>
