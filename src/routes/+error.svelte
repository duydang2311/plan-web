<script lang="ts">
	import { page } from '$app/stores';
</script>

<main class="content-center text-center min-w-screen min-h-screen w-full h-full">
	{#if $page.error}
		<h1>{$page.status}</h1>
		<p>{$page.error.message} ({$page.error.code})</p>
	{/if}
</main>
