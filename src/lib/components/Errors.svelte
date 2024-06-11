<script lang="ts">
	import clsx from 'clsx';

	interface Props {
		errors?: string[];
	}
	const { errors = [] }: Props = $props();
</script>

{#if errors?.length}
	<ol
		class={clsx(
			'm-0 p-0 text-red-500 text-sm font-medium',
			errors.length === 1 ? 'list-none' : 'list-inside'
		)}
	>
		{#each errors as error}
			<li><em>{error}</em></li>
		{/each}
	</ol>
{/if}
