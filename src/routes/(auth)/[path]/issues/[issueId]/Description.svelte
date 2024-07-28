<script lang="ts">
	import { page } from '$app/stores';
	import DOMPurify from 'isomorphic-dompurify';
	import Button from '~/lib/components/Button.svelte';
	import Tiptap from '~/lib/components/Tiptap.svelte';
	import { enhance } from '$app/forms';
	import { Editor } from '@tiptap/core';
	import type { ActionData } from './$types';
	import { slideIn, slideOut } from './transitions';
	import { fluentSearchParams } from '~/lib/utils/url';

	interface Props {
		form: ActionData;
		isEditing: boolean;
		description?: string;
	}

	const { isEditing, description }: Props = $props();
	const cancelHref = $derived(fluentSearchParams($page.url).delete('edit-desc').toString());
	const editHref = $derived(fluentSearchParams($page.url).set('edit-desc', '').toString());
	let editor = $state<Editor>();
</script>

<div class="border-b border-b-base-border pb-2">
	<div class="prose max-w-full">
		{#if isEditing}
			<div in:slideIn out:slideOut class="not-prose">
				<form
					method="post"
					action="?/edit-description"
					class="relative"
					use:enhance={(e) => {
						if (!editor) {
							e.cancel();
							return;
						}

						e.formData.set('description', editor.getHTML());
						return async ({ update }) => {
							await update();
						};
					}}
				>
					<input type="hidden" name="issueId" value={$page.params['issueId']} />
					<Tiptap
						bind:editor
						name="description"
						content={description}
						containerProps={{ class: 'pb-8' }}
					/>
					<div class="absolute right-2 bottom-2 flex gap-2">
						<Button as="link" href={cancelHref} size="sm" filled={false} variant="base"
							>Cancel</Button
						>
						<Button size="sm" variant="primary" filled={false}>Save</Button>
					</div>
				</form>
			</div>
		{:else}
			<div in:slideIn out:slideOut>
				{#if description && description !== '<p></p>'}
					<!-- eslint-disable-next-line svelte/no-at-html-tags -->
					{@html DOMPurify.sanitize(description, { USE_PROFILES: { html: true } })}
				{:else}
					<p class="text-base-fg-3"><i>No description.</i></p>
				{/if}
			</div>
		{/if}
	</div>
	<div class="mt-8">
		<Button as="link" href={editHref} variant="base" filled={false} size="sm" class="w-fit">
			Edit
		</Button>
	</div>
</div>
