<script lang="ts">
	import { page } from '$app/stores';
	import DOMPurify from 'isomorphic-dompurify';
	import Button from '~/lib/components/Button.svelte';
	import Tiptap from '~/lib/components/Tiptap.svelte';
	import { gsap } from 'gsap';
	import { enhance } from '$app/forms';
	import { Editor } from '@tiptap/core';
	import type { ActionData } from './$types';

	interface Props {
		form: ActionData;
		isEditing: boolean;
		description?: string;
	}

	const { isEditing, description }: Props = $props();
	const cancelHref = $derived.by(() => {
		$page.url.searchParams.delete('edit');
		return $page.url.pathname + $page.url.search;
	});
	let editor = $state<Editor>();

	function slideIn(node: HTMLElement) {
		gsap.from(node, {
			height: 0,
			opacity: 0,
			duration: 0.3,
			ease: 'power1.inOut',
			clearProps: 'height'
		});
		return {
			duration: 300
		};
	}

	function slideOut(node: HTMLElement) {
		gsap.to(node, {
			height: 0,
			opacity: 0,
			duration: 0.3,
			ease: 'power1.inOut'
		});
		return {
			duration: 300
		};
	}
</script>

<div class="border-b border-b-base-border pb-2">
	<div class="prose max-w-full">
		{#if isEditing}
			<div in:slideIn out:slideOut class="not-prose overflow-hidden">
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
					<Tiptap bind:editor content={description} containerProps={{ class: 'pb-8' }} />
					<div class="absolute right-2 bottom-2 flex gap-2">
						<Button as="link" href={cancelHref} size="sm" filled={false} variant="base"
							>Cancel</Button
						>
						<Button size="sm">Save</Button>
					</div>
				</form>
			</div>
		{:else}
			<div in:slideIn out:slideOut class="overflow-hidden">
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
		<Button as="link" href="?edit" variant="base" filled={false} size="sm" class="w-fit">
			Edit
		</Button>
	</div>
</div>
