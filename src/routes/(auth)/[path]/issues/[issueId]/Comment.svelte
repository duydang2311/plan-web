<script lang="ts">
	import type { IssueComment } from '~/lib/models/issue_comment';
	import DOMPurify from 'isomorphic-dompurify';
	import { DateTime } from 'luxon';

	const { comment }: { comment: IssueComment } = $props();
</script>

<div class="max-w-full rounded-md">
	<div class="flex gap-2">
		<div class="size-12 bg-primary-1 rounded-full"></div>
		<div>
			<p class="font-display font-bold">User</p>
			<p class="text-base-fg-3">
				<small>
					{DateTime.fromISO(comment.createdTime).toLocaleString(DateTime.DATETIME_SHORT)}
				</small>
			</p>
		</div>
	</div>
	<div class="mt-2 prose">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html DOMPurify.sanitize(comment.content, { USE_PROFILES: { html: true } })}
	</div>
</div>
