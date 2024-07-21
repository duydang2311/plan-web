<script lang="ts">
	import { enhance } from '$app/forms';
	import { Record } from 'effect';
	import Button from '~/lib/components/Button.svelte';
	import Errors from '~/lib/components/Errors.svelte';
	import Input from '~/lib/components/Input.svelte';
	import Label from '~/lib/components/Label.svelte';
	import TextArea from '~/lib/components/TextArea.svelte';
	import { hasProperty } from '~/lib/utils/commons';
	import type { ValidationResult } from '~/lib/utils/validation';
	import type { ActionData, PageData } from './$types';
	import { validate } from './utils';
	import Tiptap from '~/lib/components/Tiptap.svelte';
	import { Editor } from '@tiptap/core';

	const errorMap = {
		root: {
			unknown: 'An unknown error has occurred on server',
			fetch: 'Could not issue the request',
			500: 'An unknown error has occurred on server',
			404: 'Could not connect to server',
			403: 'Could not create issue due to lack of privileges'
		},
		title: {
			string: 'Enter issue title'
		},
		description: {
			string: 'Enter issue description',
			maxLength: 'Enter issue description with 65535 characters at most'
		}
	};

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let fields = $state({
		teamId: data.team.id,
		title: '',
		description: null
	});
	let status = $state<'submitting' | null>(null);
	let validation: ValidationResult | undefined;
	let editor = $state<Editor>();

	const errors = $derived(form?.errors ?? {}) as Record<string, string[]>;
</script>

<main class="max-w-screen-lg mx-auto p-8 space-y-8 max-h-full overflow-auto">
	<div>
		<h2>Create a new issue</h2>
		<p class="mb-4">Create a new issue to manage separate cycles, workflows and notifications.</p>
		<hr />
	</div>

	<form
		method="post"
		class="space-y-4"
		onchange={() => {
			validation = validate({ ...fields, description: editor!.getHTML() });
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

			const desc = editor!.getHTML();
			if (desc) {
				e.formData.set('description', desc);
			}
			status = 'submitting';
			return async ({ update }) => {
				status = null;
				await update();
			};
		}}
	>
		<input type="hidden" name="teamId" value={fields.teamId} />
		<fieldset class="space-y-1 grow">
			<Label for="name">Issue title</Label>
			<Input
				id="title"
				name="title"
				autofocus
				required
				aria-invalid={errors['title'] ? 'true' : undefined}
				bind:value={fields.title}
			/>
		</fieldset>
		<fieldset class="space-y-1 grow">
			<Label for="description">Issue description (optional)</Label>
			<noscript>
				<TextArea id="description" name="description" rows={8} bind:value={fields.description} />
			</noscript>
			<div>
				<Tiptap bind:editor placeholder="Add more detail to the issue..." class="h-96" />
			</div>
			<Errors errors={errors['description']} errorMap={errorMap.description} />
		</fieldset>
		<Button variant="primary" class="!mt-4 w-fit" disabled={status === 'submitting'}>
			Create issue
		</Button>
	</form>
	<Errors errors={errors['root']} errorMap={errorMap.root} />
</main>
