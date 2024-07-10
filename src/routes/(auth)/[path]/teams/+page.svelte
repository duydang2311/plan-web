<script lang="ts">
	import { goto, preloadData, pushState } from '$app/navigation';
	import { page } from '$app/stores';
	import { melt } from '@melt-ui/svelte';
	import { circInOut, sineInOut } from 'svelte/easing';
	import { writable } from 'svelte/store';
	import { fade } from 'svelte/transition';
	import Button from '~/lib/components/Button.svelte';
	import Dialog from '~/lib/components/Dialog.svelte';
	import Icon from '~/lib/components/Icon.svelte';
	import Input from '~/lib/components/Input.svelte';
	import Label from '~/lib/components/Label.svelte';
	import Row from '~/lib/components/Row.svelte';
	import Table from '~/lib/components/Table.svelte';
	import { flyAndScale } from '~/lib/utils/transition';
	import type { RouteParams } from './$types';
	import Breadcrumb from '~/lib/components/Breadcrumb.svelte';

	const open = writable(false);

	async function showAddTeamModal() {
		const params = $page.params as RouteParams;
		const path = `/${params.path}/teams/new`;
		const result = await preloadData(path);
		console.log(result);
		if (result.type === 'loaded' && result.status === 200) {
			$open = true;
			pushState('', { teams: { new: result.data } });
		} else {
			await goto(path);
		}
	}

	function closeModal() {
		$open = false;
		history.back();
	}
</script>

<Dialog {open} onclose={closeModal}>
	{#snippet children({ overlay, title, description, content, close })}
		<div
			use:melt={overlay}
			class="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
			transition:fade={{ duration: 150, easing: sineInOut }}
		></div>
		<div
			class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-paragraph-sm rounded-md bg-base-1
            p-6 shadow-lg"
			transition:flyAndScale={{
				duration: 150,
				y: 4,
				start: 0.98,
				easing: circInOut
			}}
			use:melt={content}
		>
			<!-- <AddTeam /> -->
			<h2 use:melt={title} class="m-0 text-lg font-medium">Create a new team</h2>
			<p use:melt={description} class="mb-5 mt-2 leading-normal">
				Create a new team to manage separate cycles, workflows and notifications.
			</p>

			<form class="space-y-4">
				<fieldset class="space-y-1">
					<Label for="name">Name</Label>
					<Input id="name" placeholder="Engineering" />
				</fieldset>
				<fieldset class="space-y-1">
					<Label for="identifier">Identifier</Label>
					<Input id="identifier" placeholder="ENG" />
				</fieldset>
				<div class="!mt-8 flex gap-8">
					<Button melt={close} variant="base" outline>Cancel</Button>
					<Button melt={close} variant="primary">Save changes</Button>
				</div>
			</form>
			<Button
				variant="base"
				aria-label="close"
				class="absolute right-4 top-4 inline-flex rounded-full w-6 h-6 p-1"
				melt={close}
			>
				<Icon name="x-mark" />
			</Button>
		</div>
	{/snippet}
</Dialog>

<main class="divide-y divide-base-border">
	<div class="flex gap-4 justify-between items-center px-8 py-2">
		<Breadcrumb />
		<Button
			as="link"
			href="teams/new"
			variant="base"
			outline
			size="sm"
			class="w-fit flex items-center gap-1"
			onclick={async (e) => {
				e.preventDefault();
				await showAddTeamModal();
			}}
		>
			<Icon name="plus" />
			Add team
		</Button>
	</div>
	<div class="flex gap-4 justify-between items-center px-8 py-2">
		<p>Filter</p>
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
			<Row>
				<td>Engineering</td>
				<td>ENG</td>
				<td>4</td>
				<td>Jun 22</td>
				<td>Jul 7</td>
			</Row>
			<Row>
				<td>Engineering</td>
				<td>ENG</td>
				<td>4</td>
				<td>Jun 22</td>
				<td>Jul 7</td>
			</Row>
			<Row>
				<td>Engineering</td>
				<td>ENG</td>
				<td>4</td>
				<td>Jun 22</td>
				<td>Jul 7</td>
			</Row>
			<Row>
				<td>Engineering</td>
				<td>ENG</td>
				<td>4</td>
				<td>Jun 22</td>
				<td>Jul 7</td>
			</Row>
			<Row>
				<td>Engineering</td>
				<td>ENG</td>
				<td>4</td>
				<td>Jun 22</td>
				<td>Jul 7</td>
			</Row>
		</tbody>
	</Table>
</main>
