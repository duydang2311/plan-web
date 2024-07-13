<script lang="ts">
	import Button from '~/lib/components/Button.svelte';
	import Icon from '~/lib/components/Icon.svelte';
	import Row from '~/lib/components/Row.svelte';
	import Table from '~/lib/components/Table.svelte';
	import type { PageData } from './$types';
	import { DateTime } from 'luxon';

	let { data }: { data: PageData } = $props();
</script>

<main class="divide-y divide-base-border">
	<div class="flex gap-4 justify-between items-center px-8 py-2">
		<p>Filter</p>
		<Button
			as="link"
			href="teams/new"
			variant="base"
			outline
			size="sm"
			class="w-fit flex items-center gap-1"
		>
			<Icon name="plus" />
			Add team
		</Button>
	</div>
	<Table>
		<thead>
			<Row class="*:py-2">
				<th>Name</th>
				<th>Identifier</th>
				<th>Members</th>
				<th>Created</th>
				<th>Updated</th>
			</Row>
		</thead>
		<tbody>
			{#if data.teams?.items.length}
				{#each data.teams.items as { createdTime, updatedTime, name, identifier }}
					<Row>
						<td>{name}</td>
						<td>{identifier}</td>
						<td>4</td>
						<td>
							{DateTime.fromISO(createdTime).toLocaleString(DateTime.DATETIME_SHORT)}
						</td>
						<td>
							{DateTime.fromISO(updatedTime).toLocaleString(DateTime.DATETIME_SHORT)}
						</td>
					</Row>
				{/each}
			{:else}
				<Row>
					<td colspan="5">No active teams yet.</td>
				</Row>
			{/if}
		</tbody>
	</Table>
</main>
