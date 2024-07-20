<script lang="ts">
	import { navigating, page } from '$app/stores';
	import clsx from 'clsx';
	import { Array, pipe } from 'effect';
	import { DateTime } from 'luxon';
	import { orderBy } from 'natural-orderby';
	import { backInOut, circInOut } from 'svelte/easing';
	import { fade, scale } from 'svelte/transition';
	import Button from '~/lib/components/Button.svelte';
	import Icon from '~/lib/components/Icon.svelte';
	import Pagination from '~/lib/components/Pagination.svelte';
	import Row from '~/lib/components/Row.svelte';
	import Spinner from '~/lib/components/Spinner.svelte';
	import Table from '~/lib/components/Table.svelte';
	import Th from '~/lib/components/Th.svelte';
	import { paginatedList } from '~/lib/models/paginatedList';
	import { watch } from '~/lib/models/watchable';
	import { mapMaybePromise } from '~/lib/utils/promise';
	import type { PageData } from './$types';
	import Link from '~/lib/components/Link.svelte';

	const { data }: { data: PageData } = $props();
	let teamList = $state(data.teamList);
	let status = $state<'pending' | 'pending-long'>();

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

	const sorted = $derived.by(() => {
		if (!orders) return teamList;
		return mapMaybePromise(teamList, (list) =>
			paginatedList({
				items: orderBy(
					list.items,
					orders.map(
						([x]) =>
							(v) =>
								v[x]
					),
					orders.map(([, x]) => x)
				),
				totalCount: list.totalCount
			})
		);
	});

	$effect(() => {
		if (data.teamList instanceof Promise) {
			status = 'pending';
			watch(data.teamList.then((v) => (teamList = v)))
				.after('1 second', () => (status = 'pending-long'))
				.finally(() => (status = undefined));
		}
	});
</script>

<main class="divide-y divide-base-border h-full flex flex-col">
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
	<div class="relative flex flex-col justify-between grow">
		{#if status === 'pending-long'}
			<div
				transition:fade={{ easing: circInOut }}
				class="fixed backdrop-blur-sm z-50 inset-0 bg-black/10"
			>
				<div
					transition:scale={{ easing: backInOut }}
					class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
				>
					<Spinner class="w-8 h-8 text-primary-1" />
				</div>
			</div>
		{/if}
		<Table>
			<thead>
				<Row class="*:py-2">
					<Th sortable name="name">Name</Th>
					<Th sortable name="identifier">Identifier</Th>
					<Th sortable name="createdTime">Created</Th>
					<Th sortable name="updatedTime">Updated</Th>
				</Row>
			</thead>
			<tbody class={clsx((status === 'pending' || status === 'pending-long') && 'animate-twPulse')}>
				{#await sorted}
					<Row>
						<td colspan="5">Loading teams...</td>
					</Row>
				{:then { items }}
					{#if items.length}
						{#each items as { createdTime, updatedTime, name, identifier }}
							<Row>
								<td><Link href="/{$page.params['path']}/teams/{identifier}/issues">{name}</Link></td
								>
								<td>{identifier}</td>
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
				{/await}
			</tbody>
		</Table>
		{#await teamList then { items, size, offset, totalCount }}
			<div class="flex justify-between items-center px-8 py-4">
				<span class="text-base-fg-3 text-sm font-bold">
					Displaying {offset + 1} - {offset + items.length} out of {totalCount} teams.
				</span>
				<Pagination {size} {totalCount} page={Number($page.url.searchParams.get('page') ?? '1')} />
			</div>
		{/await}
	</div>
</main>
