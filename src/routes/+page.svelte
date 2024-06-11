<script lang="ts">
	import { Effect } from 'effect';
	import { onMount } from 'svelte';

	let count = $state(0);

	onMount(() => {
		Effect.runSync(
			Effect.sync(() => {
				console.log('123');
			})
		);
	});
</script>

<h1>Welcome to SvelteKit {count}</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
