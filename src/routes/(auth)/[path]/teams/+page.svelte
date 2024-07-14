<script lang="ts">
	import { navigating } from '$app/stores';
	import { Array, pipe } from 'effect';
	import { DateTime } from 'luxon';
	import { orderBy } from 'natural-orderby';
	import { untrack } from 'svelte';
	import Button from '~/lib/components/Button.svelte';
	import Icon from '~/lib/components/Icon.svelte';
	import Row from '~/lib/components/Row.svelte';
	import Table from '~/lib/components/Table.svelte';
	import Th from '~/lib/components/Th.svelte';
	import type { PageData } from './$types';
	import { paginatedList } from '~/lib/models/paginatedList';

	const { data }: { data: PageData } = $props();
	const orders = $derived.by(() => {
		const order = $navigating?.to?.url.searchParams.get('order');
		if (!order) return null;
		return pipe(
			order.split(','),
			Array.map((a) => {
				let desc = a[0] === '-';
				return [desc ? a.substring(1) : a, desc ? 'desc' : 'asc'] as const;
			}),
			Array.filter(
				(a): a is ['name' | 'identifier' | 'createdTime' | 'updatedTime', 'desc' | 'asc'] =>
					a[0] === 'name' ||
					a[0] === 'identifier' ||
					a[0] === 'createdTime' ||
					a[0] === 'updatedTime'
			)
		);
	});
	const sortedTeams = $derived.by(() => {
		if (!orders) return data.teams;
		return paginatedList({
			items: orderBy(
				untrack(() => data.teams.items),
				orders.map(
					([x]) =>
						(v) =>
							v[x]
				),
				orders.map(([, x]) => x)
			),
			totalCount: data.teams.totalCount
		});
	});
</script>

<main class="divide-y divide-base-border flex flex-col">
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
	<div class="flex flex-col justify-between grow">
		<Table>
			<thead>
				<Row class="*:py-2">
					<Th sortable name="name">Name</Th>
					<Th sortable name="identifier">Identifier</Th>
					<th>Members</th>
					<Th sortable name="createdTime">Created</Th>
					<Th sortable name="updatedTime">Updated</Th>
				</Row>
			</thead>
			<tbody>
				{#if sortedTeams.items.length}
					{#each sortedTeams.items as { createdTime, updatedTime, name, identifier }}
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
		<div class="px-8 py-4">
			<span class="text-base-fg-3 text-sm font-bold">
				Displaying {data.teams.items.length} out of {data.teams.totalCount} teams.
			</span>
		</div>
	</div>
</main>
