<script lang="ts">
	import type { IssueComment } from '~/lib/models/issue_comment';
	import DOMPurify from 'isomorphic-dompurify';
	import { DateTime } from 'luxon';
	import Button from '~/lib/components/Button.svelte';
	import Tiptap from '~/lib/components/Tiptap.svelte';
	import { slideIn, slideOut } from './transitions';
	import { Editor } from '@tiptap/core';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { fluentSearchParams } from '~/lib/utils/url';

	const {
		comment,
		isAuthor,
		isEditing
	}: { comment: IssueComment; isAuthor: boolean; isEditing: boolean } = $props();
	const editHref = $derived(
		fluentSearchParams($page.url).set('edit-comment', comment.id).toString()
	);
	const cancelHref = $derived(fluentSearchParams($page.url).delete('edit-comment').toString());
	let editor = $state<Editor>();
</script>

<div class="max-w-full rounded-md">
	<div class="flex items-start gap-2">
		<div class="size-12 bg-primary-1 rounded-full"></div>
		<div>
			<p class="font-display font-bold">User</p>
			<p class="text-base-fg-3">
				<small>
					{DateTime.fromISO(comment.createdTime).toLocaleString(DateTime.DATETIME_SHORT)}
				</small>
			</p>
		</div>
		{#if isAuthor}
			<Button
				as="link"
				href={editHref}
				filled={false}
				variant="base"
				size="sm"
				class="ml-auto w-fit">Edit</Button
			>
		{/if}
	</div>
	<div class="mt-4">
		{#if isEditing}
			<div in:slideIn out:slideOut>
				<form
					method="post"
					action="?/edit-comment"
					class="relative"
					use:enhance={(e) => {
						if (!editor) {
							e.cancel();
							return;
						}
						e.formData.set('content', editor.getHTML());
					}}
				>
					<input type="hidden" name="issueCommentId" value={comment.id} />
					<Tiptap
						bind:editor
						name="content"
						content={comment.content}
						containerProps={{ class: 'pb-8' }}
					/>
					<div class="flex gap-2 absolute right-2 bottom-2">
						<Button as="link" href={cancelHref} variant="base" size="sm" filled={false}>
							Cancel
						</Button>
						<Button variant="primary" size="sm" filled={false}>Save</Button>
					</div>
				</form>
			</div>
		{:else}
			<div in:slideIn out:slideOut class="prose">
				<!-- eslint-disable-next-line svelte/no-at-html-tags -->
				{@html DOMPurify.sanitize(comment.content, { USE_PROFILES: { html: true } })}
			</div>
		{/if}
	</div>
</div>
