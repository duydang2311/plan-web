<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { Editor } from '@tiptap/core';
	import Button from '~/lib/components/Button.svelte';
	import Icon from '~/lib/components/Icon.svelte';
	import Tiptap from '~/lib/components/Tiptap.svelte';
	import type { ValidationResult } from '~/lib/utils/validation';
	import type { ActionData, PageData } from './$types';
	import Comment from './Comment.svelte';
	import Description from './Description.svelte';
	import { validate } from './utils';
	import { browser } from '$app/environment';

	const { data, form }: { data: PageData; form: ActionData } = $props();
	let editor = $state<Editor>();
	let validation = $state<ValidationResult>();

	$effect(() => {
		if (!editor) return;
		editor.on('update', (e) => {
			validation = validate({ issueId: $page.params['issueId'], content: e.editor.getText() });
		});
	});
</script>

<main class="relative h-full overflow-auto">
	<h4 class="font-bold content-center border-b border-b-base-border px-8 py-2">
		{data.issue.title}
		<span class="text-base-fg-3/60 font-normal">
			#{data.issue.orderNumber}
		</span>
	</h4>
	<div class="relative mx-auto max-w-paragraph-lg p-4">
		<Description {form} isEditing={data.isEditing} description={data.issue.description} />
		<h6 class="mt-4 font-bold">Activity</h6>
		{#await data.commentList then list}
			{#if list.items.length}
				<ol class="mt-4 space-y-8 pt-2">
					{#each list.items as comment}
						<li class="w-full">
							<Comment
								{comment}
								isAuthor={comment.authorId === data.user.id}
								isEditing={comment.id === data.editingCommentId}
							/>
						</li>
					{/each}
				</ol>
			{/if}
		{/await}
		<div class="sticky mt-8 bottom-2">
			<form
				method="post"
				action="?/comment"
				class="space-y-2"
				use:enhance={(e) => {
					if (!editor) {
						e.cancel();
						return;
					}
					e.formData.set('content', editor.getHTML());
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<input type="hidden" name="issueId" value={$page.params['issueId']} />
				<div class="relative">
					<Tiptap
						bind:editor
						placeholder="Write your comment..."
						class="min-h-20 max-h-60 bg-base-1"
					/>
					<Button
						variant="primary"
						class="absolute p-1 bottom-2 right-3 block ml-auto w-fit"
						filled={false}
						outline
						disabled={!validation?.ok}
					>
						<Icon name="arrow-up" />
					</Button>
				</div>
			</form>
		</div>
	</div>
</main>
