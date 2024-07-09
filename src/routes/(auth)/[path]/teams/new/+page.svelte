<script lang="ts">
	import { enhance } from '$app/forms';
	import { Record } from 'effect';
	import Button from '~/lib/components/Button.svelte';
	import Errors from '~/lib/components/Errors.svelte';
	import Input from '~/lib/components/Input.svelte';
	import Label from '~/lib/components/Label.svelte';
	import { hasProperty } from '~/lib/utils/commons';
	import type { ValidationResult } from '~/lib/utils/validation';
	import { validate } from './utils';
	import type { ActionData } from './$types';

	const errorMap = {
		root: {
			unknown: 'An unknown error has occurred on server',
			fetch: 'Could not issue the request',
			500: 'An unknown error has occurred on server',
			404: 'Could not connect to server'
		},
		name: {
			required: 'Enter team name'
		},
		identifier: {
			required: 'Enter team identifier',
			maxLength: 'Enter team identifier with 5 characters at most'
		}
	};

	let { form }: { form: ActionData } = $props();
	let fields = $state({
		name: '',
		identifier: ''
	});
	let status = $state<'submitting' | null>(null);
	let validation: ValidationResult | undefined;
	let dirty = $state(false);

	const errors = $derived(form?.errors ?? {}) as Record<string, string[]>;
</script>

{JSON.stringify(form)}
<main class="max-w-paragraph-lg mx-auto p-8 space-y-8">
	<div>
		<h2 class="mb-2">Create a new team</h2>
		<p class="mb-8">Create a new team to manage separate cycles, workflows and notifications.</p>
		<hr />
	</div>

	<form
		method="post"
		class="space-y-2"
		onchange={() => {
			validation = validate(fields);
			form = validation.ok
				? null
				: {
						errors: Record.filter(
							validation.errors,
							(_, k) => hasProperty(fields, k) && !!fields[k]
						)
					};
		}}
		use:enhance={(e) => {
			if (!validation?.ok) {
				e.cancel();
				return;
			}
			status = 'submitting';
			return async ({ update }) => {
				status = null;
				await update();
			};
		}}
	>
		<div class="flex gap-4 flex-wrap">
			<fieldset class="space-y-1 grow">
				<Label for="name">Team name</Label>
				<Input
					id="name"
					name="name"
					placeholder="Engineering"
					autofocus
					required
					aria-invalid={errors['name'] ? 'true' : undefined}
					bind:value={fields.name}
					oninput={() => {
						if (!dirty) {
							fields.identifier = fields.name.substring(0, 3);
						}
					}}
				/>
			</fieldset>
			<fieldset class="space-y-1 grow basis-48">
				<Label for="identifier">Team identifier</Label>
				<Input
					id="identifier"
					name="identifier"
					placeholder="ENG"
					autofocus
					required
					aria-invalid={errors['identifier'] ? 'true' : undefined}
					bind:value={fields.identifier}
					oninput={() => {
						if (fields.identifier === '') {
							dirty = false;
						} else if (
							fields.identifier !==
							fields.name.substring(0, Math.max(fields.identifier.length, 3)).toLocaleUpperCase()
						) {
							dirty = true;
						}
					}}
					onblur={() => {
						if (!dirty && fields.identifier === '') {
							fields.identifier = fields.name.substring(0, 3);
						}
					}}
					class="uppercase"
				/>
				<Errors errors={errors['identifier']} errorMap={errorMap.identifier} />
				<p class="text-base-fg-3">
					<small
						>The identifier (e.g. {fields.identifier.length
							? fields.identifier.toLocaleUpperCase()
							: 'ENG'}-001) for all issues of the team.</small
					>
				</p>
			</fieldset>
		</div>
		<Button variant="primary" class="!mt-4 capitalize w-fit" disabled={status === 'submitting'}>
			Create team
		</Button>
	</form>
	<Errors errors={errors['root']} errorMap={errorMap.root} />
</main>
